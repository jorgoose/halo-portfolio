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

export function createVFXManager(
	B: BabylonNamespace,
	scene: InstanceType<BabylonNamespace['Scene']>
): VFXManager {
	const activeTimers = new Set<ReturnType<typeof setTimeout>>();
	const activeParticles = new Set<InstanceType<BabylonNamespace['ParticleSystem']>>();

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

	// --- Pooled muzzle flash mesh + material (never disposed during gameplay) ---
	const flashMat = new B.StandardMaterial('flashMat', scene);
	flashMat.emissiveColor = new B.Color3(1.0, 0.85, 0.4);
	flashMat.diffuseColor = new B.Color3(0, 0, 0);
	flashMat.disableLighting = true;
	flashMat.backFaceCulling = false;

	const flashTex = new B.DynamicTexture('flashTex', 64, scene, false);
	flashTex.hasAlpha = true;
	const fCtx = flashTex.getContext();
	const fGrad = fCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
	fGrad.addColorStop(0, 'rgba(255, 240, 180, 1)');
	fGrad.addColorStop(0.2, 'rgba(255, 200, 80, 0.9)');
	fGrad.addColorStop(0.5, 'rgba(255, 140, 30, 0.5)');
	fGrad.addColorStop(1, 'rgba(255, 80, 0, 0)');
	fCtx.fillStyle = fGrad;
	fCtx.fillRect(0, 0, 64, 64);
	flashTex.update();
	flashMat.emissiveTexture = flashTex;
	flashMat.opacityTexture = flashTex;

	const flashMesh = B.MeshBuilder.CreatePlane('mFlash', { size: 0.25 }, scene);
	flashMesh.billboardMode = B.Mesh.BILLBOARDMODE_ALL;
	flashMesh.material = flashMat;
	flashMesh.isPickable = false;
	flashMesh.setEnabled(false);

	// --- Pooled shield flare mesh + material (never disposed during gameplay) ---
	const shieldMat = new B.StandardMaterial('shieldFlareMat', scene);
	shieldMat.emissiveColor = new B.Color3(...COLOR_SHIELD_CYAN);
	shieldMat.diffuseColor = new B.Color3(0, 0, 0);
	shieldMat.alpha = 0.25;
	shieldMat.backFaceCulling = false;

	const shieldMesh = B.MeshBuilder.CreateSphere('shieldFlare', { diameter: 2.5, segments: 8 }, scene);
	shieldMesh.material = shieldMat;
	shieldMesh.isPickable = false;
	shieldMesh.setEnabled(false);

	// --- Effect state (driven by single tick) ---
	let flashActive = false;
	let flashElapsed = 0;
	const flashDuration = MUZZLE_FLASH_DURATION + 0.02;

	let shieldActive = false;
	let shieldElapsed = 0;
	let shieldCamera: InstanceType<BabylonNamespace['FreeCamera']> | null = null;

	// --- Scratch vectors for muzzle flash positioning ---
	const _flashDir = new B.Vector3();
	const _flashPos = new B.Vector3();

	// --- Single render tick for all pooled effects ---
	const mainTick = () => {
		const dt = scene.getEngine().getDeltaTime() / 1000;

		if (flashActive) {
			flashElapsed += dt;
			const t = Math.min(flashElapsed / flashDuration, 1);
			const scale = 1.0 + 0.5 * (1 - t); // start 1.5x, shrink to 1x
			flashMesh.scaling.setAll(scale * (1 - t * 0.6));
			if (t >= 1) {
				flashActive = false;
				flashMesh.setEnabled(false);
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
		_flashDir.scaleInPlace(0.15);
		pos.addToRef(_flashDir, _flashPos);
		flashMesh.position.copyFrom(_flashPos);
		flashMesh.scaling.setAll(1.5);
		flashMesh.setEnabled(true);
		flashActive = true;
		flashElapsed = 0;
	}

	function impactSpark(pos: InstanceType<BabylonNamespace['Vector3']>) {
		const ps = new B.ParticleSystem('impactSpark', 20, scene);
		ps.particleTexture = particleTex;
		ps.emitter = pos.clone();

		ps.minLifeTime = 0.05;
		ps.maxLifeTime = 0.2;
		ps.minSize = 0.05;
		ps.maxSize = 0.15;
		ps.emitRate = 80;
		ps.minEmitPower = 2;
		ps.maxEmitPower = 5;

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
		}, 80);
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
		const ps = new B.ParticleSystem('deathEffect', 30, scene);
		ps.particleTexture = particleTex;
		ps.emitter = pos.clone();

		ps.minLifeTime = 0.3;
		ps.maxLifeTime = 0.8;
		ps.minSize = 0.1;
		ps.maxSize = 0.3;
		ps.emitRate = 300;
		ps.minEmitPower = 3;
		ps.maxEmitPower = 8;

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
		}, 200);
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
		flashMesh.dispose();
		shieldMesh.dispose();
		shieldMat.dispose();
		particleTex.dispose();
		flashTex.dispose();
		flashMat.dispose();
	}

	return { muzzleFlash, impactSpark, shieldFlare, damageFlash, deathEffect, dispose };
}
