import type { BabylonNamespace } from './types';
import { COLOR_AMBER, COLOR_ORANGE, COLOR_ENEMY_RED, COLOR_SHIELD_CYAN, MUZZLE_FLASH_DURATION } from './constants';

// Pre-allocated direction/gravity tuples for particle systems (avoids per-call allocation)
const SPARK_DIR1: [number, number, number] = [-1, 1, -1];
const SPARK_DIR2: [number, number, number] = [1, 2, 1];
const SPARK_GRAVITY: [number, number, number] = [0, -5, 0];
const DEATH_DIR1: [number, number, number] = [-1, 0.5, -1];
const DEATH_DIR2: [number, number, number] = [1, 3, 1];
const DEATH_GRAVITY: [number, number, number] = [0, -4, 0];

export interface VFXManager {
	muzzleFlash: (pos: InstanceType<BabylonNamespace['Vector3']>, dir: InstanceType<BabylonNamespace['Vector3']>) => void;
	impactSpark: (pos: InstanceType<BabylonNamespace['Vector3']>) => void;
	shieldFlare: (camera: InstanceType<BabylonNamespace['FreeCamera']>) => void;
	damageFlash: (mesh: InstanceType<BabylonNamespace['Mesh']>) => void;
	deathEffect: (pos: InstanceType<BabylonNamespace['Vector3']>) => void;
	dispose: () => void;
}

interface VFXOptions {
	lowQuality?: boolean;
}

export function createVFXManager(
	B: BabylonNamespace,
	scene: InstanceType<BabylonNamespace['Scene']>,
	options: VFXOptions = {}
): VFXManager {
	const lowQuality = options.lowQuality ?? false;
	const activeTimers = new Set<ReturnType<typeof setTimeout>>();
	let lastImpactAt = 0;
	let flashHideTimer: ReturnType<typeof setTimeout> | null = null;
	let flashFramesLeft = 0;

	/** Schedule a timeout that is automatically tracked for cleanup. */
	function tracked(fn: () => void, ms: number) {
		const id = setTimeout(() => {
			activeTimers.delete(id);
			fn();
		}, ms);
		activeTimers.add(id);
	}

	// Create a shared procedural particle texture
	const particleTex = new B.DynamicTexture('particleTex', 64, scene, false);
	const ctx = particleTex.getContext();
	const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
	gradient.addColorStop(0, 'rgba(255,255,255,1)');
	gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
	gradient.addColorStop(1, 'rgba(255,255,255,0)');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 64, 64);
	particleTex.update();

	// --- Pooled conical muzzle flash rig ---
	const flashCoreMat = new B.StandardMaterial('flashCoreMat', scene);
	flashCoreMat.emissiveColor = new B.Color3(1.0, 0.9, 0.52);
	flashCoreMat.diffuseColor = new B.Color3(0, 0, 0);
	flashCoreMat.specularColor = new B.Color3(0, 0, 0);
	flashCoreMat.alpha = 0.95;
	flashCoreMat.disableLighting = true;
	flashCoreMat.backFaceCulling = false;
	flashCoreMat.freeze();

	const flashPetalMat = new B.StandardMaterial('flashPetalMat', scene);
	flashPetalMat.emissiveColor = new B.Color3(1.0, 0.72, 0.24);
	flashPetalMat.diffuseColor = new B.Color3(0, 0, 0);
	flashPetalMat.specularColor = new B.Color3(0, 0, 0);
	flashPetalMat.alpha = 0.78;
	flashPetalMat.disableLighting = true;
	flashPetalMat.backFaceCulling = false;
	flashPetalMat.freeze();

	const flashRoot = new B.TransformNode('flashRoot', scene);

	function createFlashCone(
		name: string,
		length: number,
		width: number,
		material: InstanceType<BabylonNamespace['StandardMaterial']>
	) {
		const cone = B.MeshBuilder.CreateCylinder(
			name,
			{
				height: length,
				diameterTop: 0.002,
				diameterBottom: width,
				tessellation: 6
			},
			scene
		);
		cone.rotation.x = Math.PI / 2;
		cone.position.z = length * 0.5;
		cone.material = material;
		cone.isPickable = false;
		return cone;
	}

	const flashCorePivot = new B.TransformNode('flashCorePivot', scene);
	flashCorePivot.parent = flashRoot;
	const flashCoreCone = createFlashCone(
		'mFlashCoreCone',
		lowQuality ? 0.32 : 0.38,
		lowQuality ? 0.12 : 0.15,
		flashCoreMat
	);
	flashCoreCone.parent = flashCorePivot;

	const flashPlumePivot = new B.TransformNode('flashPlumePivot', scene);
	flashPlumePivot.parent = flashRoot;
	const flashPlumeCone = createFlashCone(
		'mFlashPlumeCone',
		lowQuality ? 0.4 : 0.52,
		lowQuality ? 0.08 : 0.1,
		flashCoreMat
	);
	flashPlumeCone.parent = flashPlumePivot;

	const flashPetalLeftPivot = new B.TransformNode('flashPetalLeftPivot', scene);
	flashPetalLeftPivot.parent = flashRoot;
	const flashPetalLeft = createFlashCone(
		'mFlashPetalLeft',
		lowQuality ? 0.28 : 0.34,
		lowQuality ? 0.06 : 0.08,
		flashPetalMat
	);
	flashPetalLeft.parent = flashPetalLeftPivot;

	const flashPetalRightPivot = new B.TransformNode('flashPetalRightPivot', scene);
	flashPetalRightPivot.parent = flashRoot;
	const flashPetalRight = createFlashCone(
		'mFlashPetalRight',
		lowQuality ? 0.28 : 0.34,
		lowQuality ? 0.06 : 0.08,
		flashPetalMat
	);
	flashPetalRight.parent = flashPetalRightPivot;

	const flashPetalUpPivot = new B.TransformNode('flashPetalUpPivot', scene);
	flashPetalUpPivot.parent = flashRoot;
	const flashPetalUp = createFlashCone(
		'mFlashPetalUp',
		lowQuality ? 0.24 : 0.3,
		lowQuality ? 0.055 : 0.07,
		flashPetalMat
	);
	flashPetalUp.parent = flashPetalUpPivot;

	const flashPetalDownPivot = new B.TransformNode('flashPetalDownPivot', scene);
	flashPetalDownPivot.parent = flashRoot;
	const flashPetalDown = createFlashCone(
		'mFlashPetalDown',
		lowQuality ? 0.24 : 0.3,
		lowQuality ? 0.055 : 0.07,
		flashPetalMat
	);
	flashPetalDown.parent = flashPetalDownPivot;

	const flashCones = [
		flashCoreCone,
		flashPlumeCone,
		flashPetalLeft,
		flashPetalRight,
		flashPetalUp,
		flashPetalDown
	];
	const setFlashEnabled = (enabled: boolean) => {
		flashRoot.setEnabled(enabled);
		for (const cone of flashCones) {
			cone.isVisible = enabled;
			cone.setEnabled(enabled);
		}
	};
	setFlashEnabled(false);

	// --- Pooled shield flare mesh + material (never disposed during gameplay) ---
	const shieldMat = new B.StandardMaterial('shieldFlareMat', scene);
	shieldMat.emissiveColor = new B.Color3(...COLOR_SHIELD_CYAN);
	shieldMat.diffuseColor = new B.Color3(0, 0, 0);
	shieldMat.alpha = 0.25;
	shieldMat.backFaceCulling = false;
	shieldMat.freeze();

	const shieldMesh = B.MeshBuilder.CreateSphere(
		'shieldFlare',
		{ diameter: 2.5, segments: lowQuality ? 5 : 8 },
		scene
	);
	shieldMesh.material = shieldMat;
	shieldMesh.isPickable = false;
	shieldMesh.setEnabled(false);

	// --- Effect state (driven by single tick) ---
	let flashActive = false;
	let flashElapsed = 0;
	const flashDuration = (MUZZLE_FLASH_DURATION + 0.02) * (lowQuality ? 0.75 : 1);

	let shieldActive = false;
	let shieldElapsed = 0;
	let shieldCamera: InstanceType<BabylonNamespace['FreeCamera']> | null = null;

	// --- Scratch vectors for muzzle flash positioning ---
	const _flashDir = new B.Vector3();
	const _flashBasePos = new B.Vector3();
	const _flashPos = new B.Vector3();
	const _flashLookAt = new B.Vector3();
	const _flashOffset = new B.Vector3();

	function endFlash() {
		flashActive = false;
		flashFramesLeft = 0;
		flashCoreMat.alpha = 0;
		flashPetalMat.alpha = 0;
		flashRoot.position.set(0, -9999, 0);
		flashRoot.rotation.set(0, 0, 0);
		setFlashEnabled(false);
		if (flashHideTimer) {
			clearTimeout(flashHideTimer);
			activeTimers.delete(flashHideTimer);
			flashHideTimer = null;
		}
	}

	// --- Single render tick for all pooled effects ---
	const mainTick = () => {
		const dt = scene.getEngine().getDeltaTime() / 1000;

		if (flashActive) {
			try {
				flashElapsed += dt;
				flashFramesLeft -= 1;
				const t = Math.min(flashElapsed / flashDuration, 1);

				// Drive flash outward from the muzzle instead of a static camera-facing pop.
				_flashDir.scaleToRef((lowQuality ? 0.12 : 0.2) * t, _flashOffset);
				_flashPos.copyFrom(_flashBasePos);
				_flashPos.addInPlace(_flashOffset);
				flashRoot.position.copyFrom(_flashPos);

				const alphaFalloff = 1 - t;
				flashCoreMat.alpha = 0.95 * alphaFalloff;
				flashPetalMat.alpha = 0.78 * alphaFalloff * alphaFalloff;

				flashCoreCone.scaling.x = 1.08 - t * 0.35;
				flashCoreCone.scaling.y = 1.08 - t * 0.35;
				flashCoreCone.scaling.z = 1.6 - t * 1.15;

				flashPlumeCone.scaling.x = 1 - t * 0.2;
				flashPlumeCone.scaling.y = 1 - t * 0.2;
				flashPlumeCone.scaling.z = 1.7 - t * 1.25;

				flashPetalLeft.scaling.x = 1 - t * 0.4;
				flashPetalLeft.scaling.y = 1 - t * 0.4;
				flashPetalLeft.scaling.z = 1.4 - t * 1.1;

				flashPetalRight.scaling.x = 1 - t * 0.4;
				flashPetalRight.scaling.y = 1 - t * 0.4;
				flashPetalRight.scaling.z = 1.4 - t * 1.1;

				flashPetalUp.scaling.x = 1 - t * 0.42;
				flashPetalUp.scaling.y = 1 - t * 0.42;
				flashPetalUp.scaling.z = 1.3 - t * 1.05;

				flashPetalDown.scaling.x = 1 - t * 0.42;
				flashPetalDown.scaling.y = 1 - t * 0.42;
				flashPetalDown.scaling.z = 1.3 - t * 1.05;

				if (t >= 1 || flashFramesLeft <= 0) {
					endFlash();
				}
			} catch {
				endFlash();
			}
		}

		if (shieldActive) {
			shieldElapsed += dt;
			if (shieldCamera) {
				shieldMesh.position.copyFrom(shieldCamera.position);
			}
			shieldMat.alpha = 0.25 * (1 - shieldElapsed / 0.3);
			if (shieldElapsed > 0.3) {
				shieldActive = false;
				shieldMesh.setEnabled(false);
				shieldCamera = null;
			}
		}
	};
	scene.registerBeforeRender(mainTick);

	function muzzleFlash(pos: InstanceType<BabylonNamespace['Vector3']>, dir: InstanceType<BabylonNamespace['Vector3']>) {
		// During sustained fire, don't kill the previous flash — just reset state
		// so the flash stays continuously visible between rapid shots.

		if (dir.lengthSquared() < 0.0001) {
			_flashDir.set(0, 0, 1);
		} else {
			dir.normalizeToRef(_flashDir);
		}
		_flashDir.scaleToRef(lowQuality ? 0.1 : 0.14, _flashOffset);
		pos.addToRef(_flashOffset, _flashBasePos);
		flashRoot.position.copyFrom(_flashBasePos);

		_flashLookAt.copyFrom(_flashBasePos);
		_flashLookAt.addInPlace(_flashDir);
		flashRoot.lookAt(_flashLookAt);

		const spread = (lowQuality ? 0.45 : 0.58) + Math.random() * 0.08;
		flashCorePivot.rotation.set(0, 0, 0);
		flashPlumePivot.rotation.set(0, 0, 0);
		flashPetalLeftPivot.rotation.set(0, -spread, 0);
		flashPetalRightPivot.rotation.set(0, spread, 0);
		flashPetalUpPivot.rotation.set(-spread * 0.72, 0, 0);
		flashPetalDownPivot.rotation.set(spread * 0.72, 0, 0);

		flashCoreCone.scaling.set(1.08, 1.08, 1.6);
		flashPlumeCone.scaling.set(1, 1, 1.7);
		flashPetalLeft.scaling.set(1, 1, 1.4);
		flashPetalRight.scaling.set(1, 1, 1.4);
		flashPetalUp.scaling.set(1, 1, 1.3);
		flashPetalDown.scaling.set(1, 1, 1.3);

		flashCoreMat.alpha = 0.95;
		flashPetalMat.alpha = 0.78;

		if (!flashActive) {
			setFlashEnabled(true);
		}
		flashActive = true;
		flashElapsed = 0;
		flashFramesLeft = lowQuality ? 3 : 4;
	}

	// --- Impact spark pool ---
	interface PooledPS { system: InstanceType<BabylonNamespace['ParticleSystem']>; emitterPos: InstanceType<BabylonNamespace['Vector3']>; available: boolean; }
	const sparkPool: PooledPS[] = [];
	for (let i = 0; i < 3; i++) {
		const emitterPos = new B.Vector3(0, -9999, 0);
		const ps = new B.ParticleSystem(`impactSpark_${i}`, lowQuality ? 10 : 20, scene);
		ps.particleTexture = particleTex;
		ps.emitter = emitterPos;
		ps.minLifeTime = 0.05;
		ps.maxLifeTime = lowQuality ? 0.16 : 0.2;
		ps.minSize = 0.05;
		ps.maxSize = lowQuality ? 0.12 : 0.15;
		ps.emitRate = lowQuality ? 45 : 80;
		ps.minEmitPower = 2;
		ps.maxEmitPower = lowQuality ? 4 : 5;
		ps.direction1 = new B.Vector3(...SPARK_DIR1);
		ps.direction2 = new B.Vector3(...SPARK_DIR2);
		ps.color1 = new B.Color4(...COLOR_ORANGE, 1);
		ps.color2 = new B.Color4(...COLOR_AMBER, 1);
		ps.colorDead = new B.Color4(0, 0, 0, 0);
		ps.gravity = new B.Vector3(...SPARK_GRAVITY);
		sparkPool.push({ system: ps, emitterPos, available: true });
	}

	function impactSpark(pos: InstanceType<BabylonNamespace['Vector3']>) {
		const now = performance.now();
		if (lowQuality && now - lastImpactAt < 45) return;
		lastImpactAt = now;

		const entry = sparkPool.find((e) => e.available);
		if (!entry) return; // graceful degradation

		entry.available = false;
		entry.emitterPos.copyFrom(pos);
		entry.system.start();

		tracked(() => {
			entry.system.stop();
			tracked(() => { entry.available = true; }, 150);
		}, lowQuality ? 60 : 80);
	}

	function shieldFlare(camera: InstanceType<BabylonNamespace['FreeCamera']>) {
		shieldMesh.position.copyFrom(camera.position);
		shieldMat.alpha = 0.25;
		shieldMesh.setEnabled(true);
		shieldActive = true;
		shieldElapsed = 0;
		shieldCamera = camera;
	}

	function damageFlash(mesh: InstanceType<BabylonNamespace['Mesh']>) {
		const mat = mesh.material as InstanceType<BabylonNamespace['StandardMaterial']> | null;
		if (!mat) return;

		const origEmissive = mat.emissiveColor.clone();
		mat.emissiveColor = new B.Color3(...COLOR_ENEMY_RED);

		tracked(() => {
			if (!mesh.isDisposed()) {
				mat.emissiveColor = origEmissive;
			}
		}, 100);
	}

	// --- Death effect pool ---
	const deathPool: PooledPS[] = [];
	for (let i = 0; i < 2; i++) {
		const emitterPos = new B.Vector3(0, -9999, 0);
		const ps = new B.ParticleSystem(`deathEffect_${i}`, lowQuality ? 16 : 30, scene);
		ps.particleTexture = particleTex;
		ps.emitter = emitterPos;
		ps.minLifeTime = lowQuality ? 0.24 : 0.3;
		ps.maxLifeTime = lowQuality ? 0.6 : 0.8;
		ps.minSize = 0.1;
		ps.maxSize = lowQuality ? 0.22 : 0.3;
		ps.emitRate = lowQuality ? 180 : 300;
		ps.minEmitPower = 3;
		ps.maxEmitPower = lowQuality ? 6 : 8;
		ps.direction1 = new B.Vector3(...DEATH_DIR1);
		ps.direction2 = new B.Vector3(...DEATH_DIR2);
		ps.color1 = new B.Color4(...COLOR_ENEMY_RED, 1);
		ps.color2 = new B.Color4(...COLOR_ORANGE, 1);
		ps.colorDead = new B.Color4(0, 0, 0, 0);
		ps.gravity = new B.Vector3(...DEATH_GRAVITY);
		deathPool.push({ system: ps, emitterPos, available: true });
	}

	function deathEffect(pos: InstanceType<BabylonNamespace['Vector3']>) {
		const entry = deathPool.find((e) => e.available);
		if (!entry) return; // graceful degradation

		entry.available = false;
		entry.emitterPos.copyFrom(pos);
		entry.system.start();

		tracked(() => {
			entry.system.stop();
			tracked(() => { entry.available = true; }, 500);
		}, lowQuality ? 150 : 200);
	}

	function dispose() {
		scene.unregisterBeforeRender(mainTick);

		endFlash();
		shieldActive = false;
		shieldCamera = null;

		// Clear all tracked timers
		activeTimers.forEach((id) => clearTimeout(id));
		activeTimers.clear();

		// Stop and dispose all pooled particle systems
		for (const entry of sparkPool) { entry.system.stop(); entry.system.dispose(); }
		for (const entry of deathPool) { entry.system.stop(); entry.system.dispose(); }

		// Dispose pooled resources
		flashCoreCone.dispose();
		flashPlumeCone.dispose();
		flashPetalLeft.dispose();
		flashPetalRight.dispose();
		flashPetalUp.dispose();
		flashPetalDown.dispose();
		flashCorePivot.dispose();
		flashPlumePivot.dispose();
		flashPetalLeftPivot.dispose();
		flashPetalRightPivot.dispose();
		flashPetalUpPivot.dispose();
		flashPetalDownPivot.dispose();
		flashRoot.dispose();
		shieldMesh.dispose();
		shieldMat.dispose();
		particleTex.dispose();
		flashCoreMat.dispose();
		flashPetalMat.dispose();
	}

	return { muzzleFlash, impactSpark, shieldFlare, damageFlash, deathEffect, dispose };
}
