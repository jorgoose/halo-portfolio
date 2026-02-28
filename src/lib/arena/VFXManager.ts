import type { BabylonNamespace } from './types';
import { COLOR_AMBER, COLOR_ORANGE, COLOR_ENEMY_RED, COLOR_SHIELD_CYAN, MUZZLE_FLASH_DURATION } from './constants';

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
	const pendingDisposals: (() => void)[] = [];
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

	// Shared muzzle flash material (reused every shot)
	const flashMat = new B.StandardMaterial('flashMat', scene);
	flashMat.emissiveColor = new B.Color3(1.0, 0.85, 0.4);
	flashMat.diffuseColor = new B.Color3(0, 0, 0);
	flashMat.disableLighting = true;
	flashMat.backFaceCulling = false;

	// Procedural flash texture — bright core with soft falloff
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

	function muzzleFlash(pos: InstanceType<BabylonNamespace['Vector3']>, dir: InstanceType<BabylonNamespace['Vector3']>) {
		const fwd = dir.normalize();

		// Billboard plane at barrel tip — always faces camera
		const flash = B.MeshBuilder.CreatePlane('mFlash', { size: 0.25 }, scene);
		flash.position = pos.add(fwd.scale(0.15));
		flash.billboardMode = B.Mesh.BILLBOARDMODE_ALL;
		flash.material = flashMat;
		flash.isPickable = false;

		// Animate: scale down and fade over ~60ms
		let elapsed = 0;
		const duration = MUZZLE_FLASH_DURATION + 0.02;
		const cleanup = () => {
			scene.unregisterBeforeRender(tick);
			flash.dispose();
			const idx = pendingDisposals.indexOf(cleanup);
			if (idx !== -1) pendingDisposals.splice(idx, 1);
		};
		const tick = () => {
			elapsed += scene.getEngine().getDeltaTime() / 1000;
			const t = Math.min(elapsed / duration, 1);
			const scale = 1.0 + 0.5 * (1 - t); // start 1.5x, shrink to 1x
			flash.scaling.setAll(scale * (1 - t * 0.6));
			if (t >= 1) cleanup();
		};
		scene.registerBeforeRender(tick);
		pendingDisposals.push(cleanup);
	}

	function impactSpark(pos: InstanceType<BabylonNamespace['Vector3']>) {
		const ps = new B.ParticleSystem('impactSpark', 20, scene);
		ps.particleTexture = particleTex;
		ps.emitter = pos.clone();

		ps.minLifeTime = 0.05;
		ps.maxLifeTime = 0.2;
		ps.minSize = 0.05;
		ps.maxSize = 0.15;
		ps.emitRate = 200;
		ps.minEmitPower = 2;
		ps.maxEmitPower = 5;

		ps.direction1 = new B.Vector3(-1, 1, -1);
		ps.direction2 = new B.Vector3(1, 2, 1);

		ps.color1 = new B.Color4(...COLOR_ORANGE, 1);
		ps.color2 = new B.Color4(...COLOR_AMBER, 1);
		ps.colorDead = new B.Color4(0, 0, 0, 0);

		ps.gravity = new B.Vector3(0, -5, 0);
		ps.start();
		activeParticles.add(ps);

		tracked(() => {
			ps.stop();
			tracked(() => {
				ps.dispose();
				activeParticles.delete(ps);
			}, 300);
		}, 80);
	}

	function shieldFlare(camera: InstanceType<BabylonNamespace['FreeCamera']>) {
		const flare = B.MeshBuilder.CreateSphere('shieldFlare', { diameter: 2.5, segments: 8 }, scene);
		flare.position = camera.position.clone();
		flare.isPickable = false;

		const mat = new B.StandardMaterial('shieldFlareMat', scene);
		mat.emissiveColor = new B.Color3(...COLOR_SHIELD_CYAN);
		mat.diffuseColor = new B.Color3(0, 0, 0);
		mat.alpha = 0.25;
		mat.backFaceCulling = false;
		flare.material = mat;

		let elapsed = 0;
		const cleanup = () => {
			scene.unregisterBeforeRender(tick);
			flare.dispose();
			mat.dispose();
			const idx = pendingDisposals.indexOf(cleanup);
			if (idx !== -1) pendingDisposals.splice(idx, 1);
		};
		const tick = () => {
			elapsed += scene.getEngine().getDeltaTime() / 1000;
			flare.position = camera.position.clone();
			mat.alpha = 0.25 * (1 - elapsed / 0.3);
			if (elapsed > 0.3) cleanup();
		};
		scene.registerBeforeRender(tick);
		pendingDisposals.push(cleanup);
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

		ps.direction1 = new B.Vector3(-1, 0.5, -1);
		ps.direction2 = new B.Vector3(1, 3, 1);

		ps.color1 = new B.Color4(...COLOR_ENEMY_RED, 1);
		ps.color2 = new B.Color4(...COLOR_ORANGE, 1);
		ps.colorDead = new B.Color4(0, 0, 0, 0);

		ps.gravity = new B.Vector3(0, -4, 0);
		ps.start();
		activeParticles.add(ps);

		tracked(() => {
			ps.stop();
			tracked(() => {
				ps.dispose();
				activeParticles.delete(ps);
			}, 1000);
		}, 200);
	}

	function dispose() {
		// Unregister orphan render callbacks and dispose their meshes
		pendingDisposals.forEach((fn) => fn());
		pendingDisposals.length = 0;

		// Clear all tracked timers
		activeTimers.forEach((id) => clearTimeout(id));
		activeTimers.clear();

		// Stop and dispose all live particle systems
		activeParticles.forEach((ps) => {
			ps.stop();
			ps.dispose();
		});
		activeParticles.clear();

		particleTex.dispose();
		flashTex.dispose();
		flashMat.dispose();
	}

	return { muzzleFlash, impactSpark, shieldFlare, damageFlash, deathEffect, dispose };
}
