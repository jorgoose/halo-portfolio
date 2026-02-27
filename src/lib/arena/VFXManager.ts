import type { BabylonNamespace } from './types';
import { COLOR_CYAN, COLOR_ORANGE, COLOR_ENEMY_RED, MUZZLE_FLASH_DURATION } from './constants';

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

	function muzzleFlash(pos: InstanceType<BabylonNamespace['Vector3']>, dir: InstanceType<BabylonNamespace['Vector3']>) {
		const flash = B.MeshBuilder.CreateSphere('muzzleFlash', { diameter: 0.3, segments: 4 }, scene);
		const flashOffset = dir.normalize().scale(0.5);
		flash.position = pos.add(flashOffset).add(new B.Vector3(0, -0.2, 0));
		flash.isPickable = false;

		const mat = new B.StandardMaterial('flashMat', scene);
		mat.emissiveColor = new B.Color3(...COLOR_CYAN);
		mat.diffuseColor = new B.Color3(0, 0, 0);
		mat.alpha = 0.9;
		flash.material = mat;

		setTimeout(() => {
			flash.dispose();
			mat.dispose();
		}, MUZZLE_FLASH_DURATION * 1000);
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
		ps.color2 = new B.Color4(...COLOR_CYAN, 1);
		ps.colorDead = new B.Color4(0, 0, 0, 0);

		ps.gravity = new B.Vector3(0, -5, 0);
		ps.start();

		setTimeout(() => {
			ps.stop();
			setTimeout(() => ps.dispose(), 300);
		}, 80);
	}

	function shieldFlare(camera: InstanceType<BabylonNamespace['FreeCamera']>) {
		const flare = B.MeshBuilder.CreateSphere('shieldFlare', { diameter: 2.5, segments: 8 }, scene);
		flare.position = camera.position.clone();
		flare.isPickable = false;

		const mat = new B.StandardMaterial('shieldFlareMat', scene);
		mat.emissiveColor = new B.Color3(...COLOR_CYAN);
		mat.diffuseColor = new B.Color3(0, 0, 0);
		mat.alpha = 0.25;
		mat.backFaceCulling = false;
		flare.material = mat;

		let elapsed = 0;
		const tick = () => {
			elapsed += scene.getEngine().getDeltaTime() / 1000;
			flare.position = camera.position.clone();
			mat.alpha = 0.25 * (1 - elapsed / 0.3);
			if (elapsed > 0.3) {
				scene.unregisterBeforeRender(tick);
				flare.dispose();
				mat.dispose();
			}
		};
		scene.registerBeforeRender(tick);
	}

	function damageFlash(mesh: InstanceType<BabylonNamespace['Mesh']>) {
		const mat = mesh.material as InstanceType<BabylonNamespace['StandardMaterial']> | null;
		if (!mat) return;

		const origEmissive = mat.emissiveColor.clone();
		mat.emissiveColor = new B.Color3(...COLOR_ENEMY_RED);

		setTimeout(() => {
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

		setTimeout(() => {
			ps.stop();
			setTimeout(() => ps.dispose(), 1000);
		}, 200);
	}

	function dispose() {
		particleTex.dispose();
		pendingDisposals.forEach((fn) => fn());
	}

	return { muzzleFlash, impactSpark, shieldFlare, damageFlash, deathEffect, dispose };
}
