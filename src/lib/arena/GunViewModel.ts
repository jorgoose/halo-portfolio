import type { BabylonNamespace } from './types';
import { assetBaseUrl } from './assetUrl';

export interface GunViewModelConfig {
	modelFile: string;
	rootPosition: [number, number, number];
	modelScale: [number, number, number];
	modelRotation: [number, number, number];
	barrelTipLocal: [number, number, number];
	hasAmmoScreen: boolean;
}

export const PRIMARY_GUN_CONFIG: GunViewModelConfig = {
	modelFile: 'ar_model.glb',
	rootPosition: [0.3, -0.3, 0.7],
	modelScale: [1, 1, 1],
	modelRotation: [0, Math.PI, 0],
	barrelTipLocal: [0, 0.20, 0.72],
	hasAmmoScreen: true
};

export const SECONDARY_GUN_CONFIG: GunViewModelConfig = {
	modelFile: 'banana_blaster.glb',
	rootPosition: [0.25, -0.35, 0.6],
	modelScale: [0.4, 0.4, 0.4],
	modelRotation: [0, Math.PI, 0],
	barrelTipLocal: [0, 0.15, 0.65],
	hasAmmoScreen: false
};

export interface GunViewModel {
	barrelTip: InstanceType<BabylonNamespace['Vector3']>;
	fireRecoil: () => void;
	reloadAnim: () => void;
	setAmmo: (count: number) => void;
	setVisible: (visible: boolean) => void;
	update: (dt: number) => void;
	reset: () => void;
	dispose: () => void;
}

export async function createGunViewModel(
	B: BabylonNamespace,
	scene: InstanceType<BabylonNamespace['Scene']>,
	camera: InstanceType<BabylonNamespace['FreeCamera']>,
	config: GunViewModelConfig = PRIMARY_GUN_CONFIG
): Promise<GunViewModel> {

	// Root node parented to camera
	const root = new B.TransformNode('gunRoot_' + config.modelFile, scene);
	root.parent = camera;
	root.position = new B.Vector3(...config.rootPosition);

	// Register GLTF loader plugin
	await import('@babylonjs/loaders/glTF');

	const { SceneLoader } = await import('@babylonjs/core');

	// Load GLB model
	const result = await SceneLoader.ImportMeshAsync(
		'',
		assetBaseUrl(),
		config.modelFile,
		scene
	);

	// Parent all loaded meshes under root, make non-pickable
	const loadedRoot = new B.TransformNode('gunModelRoot_' + config.modelFile, scene);
	loadedRoot.parent = root;
	loadedRoot.scaling = new B.Vector3(...config.modelScale);
	loadedRoot.rotation = new B.Vector3(...config.modelRotation);

	for (const mesh of result.meshes) {
		if (!mesh.parent) {
			mesh.parent = loadedRoot;
		}
		mesh.isPickable = false;
	}

	const barrelTipLocal = new B.Vector3(...config.barrelTipLocal);

	// --- Ammo Counter Screen (primary AR only) ---
	let ammoTex: InstanceType<BabylonNamespace['DynamicTexture']> | null = null;
	let ammoPlane: InstanceType<BabylonNamespace['Mesh']> | null = null;
	let currentAmmo = 32;

	function drawAmmoCount(count: number) {
		if (!ammoTex) return;
		const ctx = ammoTex.getContext() as unknown as CanvasRenderingContext2D;
		ctx.clearRect(0, 0, 256, 128);

		const text = String(count).padStart(2, '0');
		const color = count <= 8 ? '#ff4422' : '#44ddff';
		const glowColor = count <= 8 ? '#ff2200' : '#00aaff';

		ctx.font = 'bold 100px monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		ctx.save();
		ctx.shadowColor = glowColor;
		ctx.shadowBlur = 6;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.fillStyle = color;
		ctx.fillText(text, 128, 66);
		ctx.restore();

		ctx.fillStyle = '#ffffff';
		ctx.globalAlpha = 0.55;
		ctx.fillText(text, 128, 66);
		ctx.globalAlpha = 1.0;

		ammoTex.update();
	}

	function setAmmo(count: number) {
		if (count !== currentAmmo) {
			currentAmmo = count;
			drawAmmoCount(count);
		}
	}

	if (config.hasAmmoScreen) {
		ammoTex = new B.DynamicTexture('ammoTex', { width: 256, height: 128 }, scene, false);
		ammoTex.hasAlpha = true;

		const ammoMat = new B.StandardMaterial('ammoScreenMat', scene);
		ammoMat.emissiveTexture = ammoTex;
		ammoMat.opacityTexture = ammoTex;
		ammoMat.diffuseColor = new B.Color3(0, 0, 0);
		ammoMat.specularColor = new B.Color3(0, 0, 0);
		ammoMat.disableLighting = true;
		ammoMat.backFaceCulling = false;
		ammoMat.freeze();

		const ammoScreenHeight = 0.04;
		const ammoScreenAngle = Math.PI / 7;
		ammoPlane = B.MeshBuilder.CreatePlane(
			'ammoScreen',
			{ width: 0.045, height: ammoScreenHeight },
			scene
		);
		ammoPlane.parent = root;
		const halfGrowth = (ammoScreenHeight - 0.022) / 2;
		ammoPlane.position = new B.Vector3(
			0.0,
			0.3 - halfGrowth * Math.cos(ammoScreenAngle),
			-0.187 + halfGrowth * Math.sin(ammoScreenAngle)
		);
		ammoPlane.rotation = new B.Vector3(ammoScreenAngle, 0, 0);
		ammoPlane.material = ammoMat;
		ammoPlane.isPickable = false;

		drawAmmoCount(currentAmmo);
	}

	// --- Animation State ---
	let recoilTime = -1;
	let recoilDirX = 1; // alternates left/right each shot
	let reloadTime = -1;
	let idlePhase = 0;

	const restPos = root.position.clone();
	const restRotX = 0;

	// Anti-clip: pull gun back when near geometry
	const _clipRay = new B.Ray(new B.Vector3(), new B.Vector3(), 2.2);
	const clipMaxDist = 2.2; // ray length
	const clipMinDist = 0.7; // distance at which gun is fully retracted
	let clipPullback = 0;

	function fireRecoil() {
		recoilTime = 0;
		// Tiny random horizontal variation
		recoilDirX = (Math.random() - 0.5) * 0.4;
	}

	function reloadAnim() {
		reloadTime = 0;
	}

	function update(dt: number) {
		// Anti-clip: cast ray forward from camera to detect nearby geometry
		_clipRay.origin.copyFrom(camera.position);
		camera.getDirectionToRef(B.Vector3.Forward(), _clipRay.direction);
		const clipHit = scene.pickWithRay(_clipRay, (mesh) => mesh.checkCollisions && mesh.isPickable);
		const targetPull = (clipHit?.hit && clipHit.distance < clipMaxDist)
			? 1 - Math.max(clipHit.distance - clipMinDist, 0) / (clipMaxDist - clipMinDist)
			: 0;
		// Smooth transition
		clipPullback += (targetPull - clipPullback) * Math.min(dt * 15, 1);

		// Idle bob
		idlePhase += dt * 1.8;
		const bobX = Math.sin(idlePhase) * 0.003;
		const bobY = Math.sin(idlePhase * 1.3) * 0.004;

		let offsetX = 0;
		let offsetZ = 0;
		let rotX = 0;
		let rotY = 0;

		// Recoil animation — strong upward kick with subtle horizontal drift (Halo-style)
		// Kick phase 0.02s, return phase 0.05s (total 0.07s, fits within fire rate)
		if (recoilTime >= 0) {
			recoilTime += dt;
			if (recoilTime < 0.02) {
				const t = recoilTime / 0.02;
				offsetX = recoilDirX * 0.002 * t;
				offsetZ = -0.025 * t;
				rotX = -0.045 * t;
				rotY = recoilDirX * 0.006 * t;
			} else if (recoilTime < 0.07) {
				const t = (recoilTime - 0.02) / 0.05;
				offsetX = recoilDirX * 0.002 * (1 - t);
				offsetZ = -0.025 * (1 - t);
				rotX = -0.045 * (1 - t);
				rotY = recoilDirX * 0.006 * (1 - t);
			} else {
				recoilTime = -1;
			}
		}

		// Reload animation (dip down and back)
		if (reloadTime >= 0) {
			reloadTime += dt;
			const reloadDur = 1.2;
			if (reloadTime < reloadDur) {
				const t = reloadTime / reloadDur;
				const dip = t < 0.5 ? t * 2 : (1 - t) * 2;
				root.position.y = restPos.y - 0.15 * dip + bobY;
				root.position.x = restPos.x + bobX;
				root.position.z = restPos.z + offsetZ;
				root.rotation.x = rotX + 0.3 * dip;
				return;
			} else {
				reloadTime = -1;
			}
		}

		const pullZ = clipPullback * (restPos.z + 0.3); // pull past rest Z to fully clear barrel
		root.position.x = restPos.x + bobX + offsetX;
		root.position.y = restPos.y + bobY;
		root.position.z = restPos.z + offsetZ - pullZ;
		root.rotation.x = restRotX + rotX;
		root.rotation.y = rotY;
	}

	const _barrelTip = new B.Vector3();

	function getBarrelTip(): InstanceType<BabylonNamespace['Vector3']> {
		const worldMatrix = root.getWorldMatrix();
		B.Vector3.TransformCoordinatesToRef(barrelTipLocal, worldMatrix, _barrelTip);
		return _barrelTip;
	}

	function setVisible(visible: boolean) {
		root.setEnabled(visible);
	}

	function reset() {
		recoilTime = -1;
		reloadTime = -1;
		idlePhase = 0;
		root.position.copyFrom(restPos);
		root.rotation.x = restRotX;
	}

	function dispose() {
		root.dispose(false, true);
	}

	return {
		get barrelTip() {
			return getBarrelTip();
		},
		fireRecoil,
		reloadAnim,
		setAmmo,
		setVisible,
		update,
		reset,
		dispose
	};
}
