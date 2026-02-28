import type { BabylonNamespace } from './types';
import type { VFXManager } from './VFXManager';
import type { PlayerController } from './PlayerController';
import type { GunViewModel } from './GunViewModel';
import {
	WEAPON_DAMAGE,
	FIRE_RATE,
	MAX_AMMO,
	RESERVE_AMMO,
	RELOAD_TIME,
	HIT_MARKER_DURATION
} from './constants';

export interface WeaponSystem {
	ammo: number;
	reserveAmmo: number;
	reloading: boolean;
	hitMarkerActive: boolean;
	fire: () => { hit: boolean; enemyMesh: InstanceType<BabylonNamespace['AbstractMesh']> | null };
	reload: () => void;
	update: (dt: number) => void;
	reset: () => void;
	dispose: () => void;
}

export function createWeaponSystem(
	B: BabylonNamespace,
	scene: InstanceType<BabylonNamespace['Scene']>,
	player: PlayerController,
	vfx: VFXManager,
	gun: GunViewModel
): WeaponSystem {
	let ammo = MAX_AMMO;
	let reserveAmmo = RESERVE_AMMO;
	let cooldown = 0;
	let reloading = false;
	let reloadTimer = 0;
	let hitMarkerActive = false;
	let hitMarkerTimer = 0;

	function fire(): { hit: boolean; enemyMesh: InstanceType<BabylonNamespace['AbstractMesh']> | null } {
		if (cooldown > 0 || reloading || ammo <= 0) {
			return { hit: false, enemyMesh: null };
		}

		ammo--;
		cooldown = FIRE_RATE;

		const ray = player.getForwardRay();

		// Gun recoil + muzzle flash from barrel tip
		gun.fireRecoil();
		vfx.muzzleFlash(gun.barrelTip, ray.direction.clone());

		// Single raycast — pick closest pickable mesh (enemies, walls, rocks)
		const pick = scene.pickWithRay(ray, (mesh) => {
			return mesh.isPickable && mesh.name !== 'playerCam';
		});

		if (pick?.hit && pick.pickedPoint) {
			vfx.impactSpark(pick.pickedPoint);

			if (pick.pickedMesh?.metadata?.enemy) {
				hitMarkerActive = true;
				hitMarkerTimer = HIT_MARKER_DURATION;

				if (ammo <= 0 && reserveAmmo > 0) {
					reload();
				}
				return { hit: true, enemyMesh: pick.pickedMesh };
			}
		}

		if (ammo <= 0 && reserveAmmo > 0) {
			reload();
		}

		return { hit: false, enemyMesh: null };
	}

	function reload() {
		if (reloading || ammo >= MAX_AMMO || reserveAmmo <= 0) return;
		reloading = true;
		reloadTimer = RELOAD_TIME;
		gun.reloadAnim();
	}

	function update(dt: number) {
		if (cooldown > 0) cooldown -= dt;

		if (hitMarkerTimer > 0) {
			hitMarkerTimer -= dt;
			if (hitMarkerTimer <= 0) {
				hitMarkerActive = false;
			}
		}

		if (reloading) {
			reloadTimer -= dt;
			if (reloadTimer <= 0) {
				const needed = MAX_AMMO - ammo;
				const toLoad = Math.min(needed, reserveAmmo);
				ammo += toLoad;
				reserveAmmo -= toLoad;
				reloading = false;
			}
		}
	}

	function reset() {
		ammo = MAX_AMMO;
		reserveAmmo = RESERVE_AMMO;
		cooldown = 0;
		reloading = false;
		reloadTimer = 0;
		hitMarkerActive = false;
		hitMarkerTimer = 0;
	}

	function dispose() {
		// nothing to clean up
	}

	return {
		get ammo() { return ammo; },
		get reserveAmmo() { return reserveAmmo; },
		get reloading() { return reloading; },
		get hitMarkerActive() { return hitMarkerActive; },
		fire,
		reload,
		update,
		reset,
		dispose
	};
}
