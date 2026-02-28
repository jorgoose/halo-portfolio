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
	const activeParticles = new Set<InstanceType<BabylonNamespace['ParticleSystem']>>();
	let lastImpactAt = 0;

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

	// --- Pooled directional muzzle flash rig ---
	const flashHaloTex = new B.DynamicTexture('flashHaloTex', 64, scene, false);
	flashHaloTex.hasAlpha = true;
	const haloCtx = flashHaloTex.getContext();
	const haloGrad = haloCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
	haloGrad.addColorStop(0, 'rgba(255, 245, 210, 1)');
	haloGrad.addColorStop(0.18, 'rgba(255, 210, 120, 0.9)');
	haloGrad.addColorStop(0.55, 'rgba(255, 140, 40, 0.45)');
	haloGrad.addColorStop(1, 'rgba(255, 80, 0, 0)');
	haloCtx.fillStyle = haloGrad;
	haloCtx.fillRect(0, 0, 64, 64);
	flashHaloTex.update();

	const flashStreakTex = new B.DynamicTexture('flashStreakTex', { width: 64, height: 128 }, scene, false);
	flashStreakTex.hasAlpha = true;
	const streakCtx = flashStreakTex.getContext();
	const streakGrad = streakCtx.createLinearGradient(0, 128, 0, 0);
	streakGrad.addColorStop(0, 'rgba(255, 140, 0, 0)');
	streakGrad.addColorStop(0.25, 'rgba(255, 190, 70, 0.45)');
	streakGrad.addColorStop(0.7, 'rgba(255, 235, 170, 0.95)');
	streakGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
	streakCtx.fillStyle = streakGrad;
	streakCtx.fillRect(0, 0, 64, 128);
	flashStreakTex.update();

	const flashCoreMat = new B.StandardMaterial('flashCoreMat', scene);
	flashCoreMat.emissiveColor = new B.Color3(1.0, 0.84, 0.35);
	flashCoreMat.diffuseColor = new B.Color3(0, 0, 0);
	flashCoreMat.specularColor = new B.Color3(0, 0, 0);
	flashCoreMat.alpha = 0.95;
	flashCoreMat.disableLighting = true;
	flashCoreMat.backFaceCulling = false;

	const flashStreakMat = new B.StandardMaterial('flashStreakMat', scene);
	flashStreakMat.emissiveTexture = flashStreakTex;
	flashStreakMat.opacityTexture = flashStreakTex;
	flashStreakMat.emissiveColor = new B.Color3(1.0, 0.86, 0.48);
	flashStreakMat.diffuseColor = new B.Color3(0, 0, 0);
	flashStreakMat.specularColor = new B.Color3(0, 0, 0);
	flashStreakMat.alpha = 0.9;
	flashStreakMat.disableLighting = true;
	flashStreakMat.backFaceCulling = false;

	const flashHaloMat = new B.StandardMaterial('flashHaloMat', scene);
	flashHaloMat.emissiveTexture = flashHaloTex;
	flashHaloMat.opacityTexture = flashHaloTex;
	flashHaloMat.emissiveColor = new B.Color3(1.0, 0.9, 0.55);
	flashHaloMat.diffuseColor = new B.Color3(0, 0, 0);
	flashHaloMat.specularColor = new B.Color3(0, 0, 0);
	flashHaloMat.alpha = 0.95;
	flashHaloMat.disableLighting = true;
	flashHaloMat.backFaceCulling = false;

	const flashRoot = new B.TransformNode('flashRoot', scene);

	const flashCore = B.MeshBuilder.CreateCylinder(
		'mFlashCore',
		{ height: lowQuality ? 0.2 : 0.28, diameterTop: 0.02, diameterBottom: lowQuality ? 0.08 : 0.11, tessellation: 6 },
		scene
	);
	flashCore.rotation.x = Math.PI / 2;
	flashCore.position.z = lowQuality ? 0.1 : 0.14;
	flashCore.material = flashCoreMat;
	flashCore.isPickable = false;
	flashCore.parent = flashRoot;

	const flashStreakA = B.MeshBuilder.CreatePlane(
		'mFlashStreakA',
		{ width: lowQuality ? 0.05 : 0.06, height: lowQuality ? 0.28 : 0.42 },
		scene
	);
	flashStreakA.rotation.x = Math.PI / 2;
	flashStreakA.position.z = lowQuality ? 0.12 : 0.16;
	flashStreakA.material = flashStreakMat;
	flashStreakA.isPickable = false;
	flashStreakA.parent = flashRoot;

	const flashStreakB = B.MeshBuilder.CreatePlane(
		'mFlashStreakB',
		{ width: lowQuality ? 0.05 : 0.06, height: lowQuality ? 0.26 : 0.38 },
		scene
	);
	flashStreakB.rotation.x = Math.PI / 2;
	flashStreakB.position.z = lowQuality ? 0.11 : 0.15;
	flashStreakB.material = flashStreakMat;
	flashStreakB.isPickable = false;
	flashStreakB.parent = flashRoot;

	const flashHalo = B.MeshBuilder.CreatePlane('mFlashHalo', { size: lowQuality ? 0.14 : 0.18 }, scene);
	flashHalo.position.z = 0.03;
	flashHalo.material = flashHaloMat;
	flashHalo.isPickable = false;
	flashHalo.parent = flashRoot;

	const setFlashEnabled = (enabled: boolean) => {
		flashCore.setEnabled(enabled);
		flashStreakA.setEnabled(enabled);
		flashStreakB.setEnabled(enabled);
		flashHalo.setEnabled(enabled);
	};
	setFlashEnabled(false);

	// --- Pooled shield flare mesh + material (never disposed during gameplay) ---
	const shieldMat = new B.StandardMaterial('shieldFlareMat', scene);
	shieldMat.emissiveColor = new B.Color3(...COLOR_SHIELD_CYAN);
	shieldMat.diffuseColor = new B.Color3(0, 0, 0);
	shieldMat.alpha = 0.25;
	shieldMat.backFaceCulling = false;

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

	// --- Single render tick for all pooled effects ---
	const mainTick = () => {
		const dt = scene.getEngine().getDeltaTime() / 1000;

		if (flashActive) {
			flashElapsed += dt;
			const t = Math.min(flashElapsed / flashDuration, 1);

			// Drive flash outward from the muzzle instead of a static camera-facing pop.
			_flashDir.scaleToRef((lowQuality ? 0.12 : 0.2) * t, _flashOffset);
			_flashPos.copyFrom(_flashBasePos);
			_flashPos.addInPlace(_flashOffset);
			flashRoot.position.copyFrom(_flashPos);

			const alphaFalloff = 1 - t;
			flashCoreMat.alpha = 0.95 * alphaFalloff;
			flashStreakMat.alpha = 0.88 * alphaFalloff;
			flashHaloMat.alpha = 0.9 * alphaFalloff;

			flashCore.scaling.x = 1 + t * 0.35;
			flashCore.scaling.y = 1 + t * 0.35;
			flashCore.scaling.z = 1.25 - t * 0.8;

			const streakLen = 1.45 - t * 0.95;
			flashStreakA.scaling.x = 1 - t * 0.3;
			flashStreakA.scaling.y = streakLen;
			flashStreakB.scaling.x = 1 - t * 0.25;
			flashStreakB.scaling.y = streakLen * 0.9;

			const haloScale = 1.2 - t * 0.9;
			flashHalo.scaling.setAll(haloScale);

			if (t >= 1) {
				flashActive = false;
				setFlashEnabled(false);
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
		dir.normalizeToRef(_flashDir);
		_flashDir.scaleToRef(lowQuality ? 0.1 : 0.14, _flashOffset);
		pos.addToRef(_flashOffset, _flashBasePos);
		flashRoot.position.copyFrom(_flashBasePos);

		_flashLookAt.copyFrom(_flashBasePos);
		_flashLookAt.addInPlace(_flashDir);
		flashRoot.lookAt(_flashLookAt);

		const roll = Math.random() * Math.PI;
		flashStreakA.rotation.z = roll;
		flashStreakB.rotation.z = roll + Math.PI / 2;
		flashHalo.rotation.z = roll * 0.65;

		flashCore.scaling.set(1, 1, 1.25);
		flashStreakA.scaling.set(1, 1.45, 1);
		flashStreakB.scaling.set(1, 1.3, 1);
		flashHalo.scaling.setAll(1.2);

		flashCoreMat.alpha = 0.95;
		flashStreakMat.alpha = 0.88;
		flashHaloMat.alpha = 0.9;

		setFlashEnabled(true);
		flashActive = true;
		flashElapsed = 0;
	}

	function impactSpark(pos: InstanceType<BabylonNamespace['Vector3']>) {
		const now = performance.now();
		if (lowQuality && now - lastImpactAt < 45) return;
		lastImpactAt = now;

		const ps = new B.ParticleSystem('impactSpark', lowQuality ? 10 : 20, scene);
		ps.particleTexture = particleTex;
		ps.emitter = pos.clone();

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
		ps.start();
		activeParticles.add(ps);

		tracked(() => {
			ps.stop();
			tracked(() => {
				ps.dispose();
				activeParticles.delete(ps);
			}, 150);
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

	function deathEffect(pos: InstanceType<BabylonNamespace['Vector3']>) {
		const ps = new B.ParticleSystem('deathEffect', lowQuality ? 16 : 30, scene);
		ps.particleTexture = particleTex;
		ps.emitter = pos.clone();

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
		ps.start();
		activeParticles.add(ps);

		tracked(() => {
			ps.stop();
			tracked(() => {
				ps.dispose();
				activeParticles.delete(ps);
			}, 500);
		}, lowQuality ? 150 : 200);
	}

	function dispose() {
		scene.unregisterBeforeRender(mainTick);

		flashActive = false;
		shieldActive = false;
		shieldCamera = null;

		// Clear all tracked timers
		activeTimers.forEach((id) => clearTimeout(id));
		activeTimers.clear();

		// Stop and dispose all live particle systems
		activeParticles.forEach((ps) => {
			ps.stop();
			ps.dispose();
		});
		activeParticles.clear();

		// Dispose pooled resources
		flashCore.dispose();
		flashStreakA.dispose();
		flashStreakB.dispose();
		flashHalo.dispose();
		flashRoot.dispose();
		shieldMesh.dispose();
		shieldMat.dispose();
		particleTex.dispose();
		flashHaloTex.dispose();
		flashStreakTex.dispose();
		flashCoreMat.dispose();
		flashStreakMat.dispose();
		flashHaloMat.dispose();
	}

	return { muzzleFlash, impactSpark, shieldFlare, damageFlash, deathEffect, dispose };
}
