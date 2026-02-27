import type { BabylonNamespace } from './types';
import { COLOR_FORERUNNER_SILVER, COLOR_AMBER } from './constants';

export interface GunViewModel {
	barrelTip: InstanceType<BabylonNamespace['Vector3']>;
	fireRecoil: () => void;
	reloadAnim: () => void;
	update: (dt: number) => void;
	reset: () => void;
	dispose: () => void;
}

export function createGunViewModel(
	B: BabylonNamespace,
	scene: InstanceType<BabylonNamespace['Scene']>,
	camera: InstanceType<BabylonNamespace['FreeCamera']>
): GunViewModel {
	// Root node parented to camera
	const root = new B.TransformNode('gunRoot', scene);
	root.parent = camera;
	root.position = new B.Vector3(0.3, -0.3, 0.7);

	// --- Materials ---
	const silverGunMat = new B.StandardMaterial('gunSilverMat', scene);
	silverGunMat.diffuseColor = new B.Color3(...COLOR_FORERUNNER_SILVER);
	silverGunMat.specularColor = new B.Color3(0.5, 0.5, 0.48);
	silverGunMat.emissiveColor = new B.Color3(0.04, 0.04, 0.04);

	const darkGripMat = new B.StandardMaterial('gunGripMat', scene);
	darkGripMat.diffuseColor = new B.Color3(0.08, 0.08, 0.09);
	darkGripMat.specularColor = new B.Color3(0.05, 0.05, 0.05);

	const amberAccentMat = new B.StandardMaterial('gunAmberMat', scene);
	amberAccentMat.emissiveColor = new B.Color3(...COLOR_AMBER);
	amberAccentMat.diffuseColor = new B.Color3(0, 0, 0);

	// --- Gun Parts ---
	// Main body
	const body = B.MeshBuilder.CreateBox('gunBody', { width: 0.08, height: 0.06, depth: 0.35 }, scene);
	body.parent = root;
	body.position = new B.Vector3(0, 0, 0);
	body.material = silverGunMat;
	body.isPickable = false;

	// Barrel
	const barrel = B.MeshBuilder.CreateCylinder('gunBarrel', { height: 0.3, diameter: 0.03, tessellation: 8 }, scene);
	barrel.parent = root;
	barrel.rotation.x = Math.PI / 2;
	barrel.position = new B.Vector3(0, 0.01, 0.32);
	barrel.material = silverGunMat;
	barrel.isPickable = false;

	// Barrel shroud
	const shroud = B.MeshBuilder.CreateCylinder('gunShroud', { height: 0.2, diameter: 0.05, tessellation: 8 }, scene);
	shroud.parent = root;
	shroud.rotation.x = Math.PI / 2;
	shroud.position = new B.Vector3(0, 0.01, 0.28);
	shroud.material = silverGunMat;
	shroud.isPickable = false;

	// Stock
	const stock = B.MeshBuilder.CreateBox('gunStock', { width: 0.06, height: 0.05, depth: 0.12 }, scene);
	stock.parent = root;
	stock.position = new B.Vector3(0, -0.01, -0.2);
	stock.material = darkGripMat;
	stock.isPickable = false;

	// Grip
	const grip = B.MeshBuilder.CreateBox('gunGrip', { width: 0.04, height: 0.1, depth: 0.05 }, scene);
	grip.parent = root;
	grip.position = new B.Vector3(0, -0.07, -0.05);
	grip.rotation.x = 0.2;
	grip.material = darkGripMat;
	grip.isPickable = false;

	// Magazine
	const mag = B.MeshBuilder.CreateBox('gunMag', { width: 0.04, height: 0.08, depth: 0.04 }, scene);
	mag.parent = root;
	mag.position = new B.Vector3(0, -0.07, 0.06);
	mag.material = darkGripMat;
	mag.isPickable = false;

	// Scope rail
	const rail = B.MeshBuilder.CreateBox('gunRail', { width: 0.03, height: 0.015, depth: 0.15 }, scene);
	rail.parent = root;
	rail.position = new B.Vector3(0, 0.04, 0.05);
	rail.material = silverGunMat;
	rail.isPickable = false;

	// Amber accent strips
	const bodyStrip = B.MeshBuilder.CreateBox('gunAccent1', { width: 0.085, height: 0.008, depth: 0.32 }, scene);
	bodyStrip.parent = root;
	bodyStrip.position = new B.Vector3(0, 0.032, 0.01);
	bodyStrip.material = amberAccentMat;
	bodyStrip.isPickable = false;

	const barrelStrip = B.MeshBuilder.CreateBox('gunAccent2', { width: 0.008, height: 0.008, depth: 0.25 }, scene);
	barrelStrip.parent = root;
	barrelStrip.position = new B.Vector3(0.022, 0.01, 0.3);
	barrelStrip.material = amberAccentMat;
	barrelStrip.isPickable = false;

	// Barrel tip reference point (local space)
	const barrelTipLocal = new B.Vector3(0, 0.01, 0.47);

	// --- Animation State ---
	let recoilTime = -1; // negative = not animating
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
				// Kick phase
				const t = recoilTime / 0.04;
				offsetZ = -0.06 * t;
				rotX = -0.08 * t;
			} else if (recoilTime < 0.16) {
				// Return phase
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
				// Down and back in first half, up in second half
				const dip = t < 0.5 ? t * 2 : (1 - t) * 2;
				root.position.y = restPos.y - 0.15 * dip + bobY;
				root.position.x = restPos.x + bobX;
				root.position.z = restPos.z + offsetZ;
				root.rotation.x = rotX + 0.3 * dip;
				return; // skip normal position update
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
		// Transform barrel tip from local gun space to world space
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
		silverGunMat.dispose();
		darkGripMat.dispose();
		amberAccentMat.dispose();
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
