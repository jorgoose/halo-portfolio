import type { BabylonNamespace } from './types';

export interface GunViewModel {
	barrelTip: InstanceType<BabylonNamespace['Vector3']>;
	fireRecoil: () => void;
	reloadAnim: () => void;
	update: (dt: number) => void;
	reset: () => void;
	dispose: () => void;
}

export async function createGunViewModel(
	B: BabylonNamespace,
	scene: InstanceType<BabylonNamespace['Scene']>,
	camera: InstanceType<BabylonNamespace['FreeCamera']>
): Promise<GunViewModel> {
	// Register GLTF loader plugin
	await import('@babylonjs/loaders/glTF');

	const { SceneLoader } = await import('@babylonjs/core');

	// Root node parented to camera
	const root = new B.TransformNode('gunRoot', scene);
	root.parent = camera;
	root.position = new B.Vector3(0.3, -0.3, 0.7);

	// Load GLB model from R2
	const result = await SceneLoader.ImportMeshAsync(
		'',
		'https://pub-cfd1b536da7f445ea0edcd97b6b9b139.r2.dev/',
		'ar_model.glb',
		scene
	);

	// Parent all loaded meshes under root, make non-pickable
	const loadedRoot = new B.TransformNode('gunModelRoot', scene);
	loadedRoot.parent = root;
	// Scale and position adjustments — will likely need tuning
	loadedRoot.scaling = new B.Vector3(0.15, 0.15, 0.15);
	loadedRoot.rotation = new B.Vector3(0, Math.PI, 0); // face forward

	for (const mesh of result.meshes) {
		if (!mesh.parent) {
			mesh.parent = loadedRoot;
		}
		mesh.isPickable = false;
	}

	// Barrel tip reference point (local space relative to root)
	// Adjusted for the model — tip of barrel in front
	const barrelTipLocal = new B.Vector3(0, 0.01, 0.47);

	// --- Animation State ---
	let recoilTime = -1;
	let reloadTime = -1;
	let idlePhase = 0;

	const restPos = root.position.clone();
	const restRotX = 0;

	function fireRecoil() {
		recoilTime = 0;
	}

	function reloadAnim() {
		reloadTime = 0;
	}

	function update(dt: number) {
		// Idle bob
		idlePhase += dt * 1.8;
		const bobX = Math.sin(idlePhase) * 0.003;
		const bobY = Math.sin(idlePhase * 1.3) * 0.004;

		let offsetZ = 0;
		let rotX = 0;

		// Recoil animation (kick back 0.04s, return 0.12s)
		if (recoilTime >= 0) {
			recoilTime += dt;
			if (recoilTime < 0.04) {
				const t = recoilTime / 0.04;
				offsetZ = -0.06 * t;
				rotX = -0.08 * t;
			} else if (recoilTime < 0.16) {
				const t = (recoilTime - 0.04) / 0.12;
				offsetZ = -0.06 * (1 - t);
				rotX = -0.08 * (1 - t);
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

		root.position.x = restPos.x + bobX;
		root.position.y = restPos.y + bobY;
		root.position.z = restPos.z + offsetZ;
		root.rotation.x = restRotX + rotX;
	}

	function getBarrelTip(): InstanceType<BabylonNamespace['Vector3']> {
		const worldMatrix = root.getWorldMatrix();
		return B.Vector3.TransformCoordinates(barrelTipLocal, worldMatrix);
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
		update,
		reset,
		dispose
	};
}
