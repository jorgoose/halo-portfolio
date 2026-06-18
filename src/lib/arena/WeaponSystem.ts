import type { BabylonNamespace } from './types';
import type { VFXManager } from './VFXManager';
import type { PlayerController } from './PlayerController';
import type { GunViewModel } from './GunViewModel';
import { HIT_MARKER_DURATION, MAX_SHOTS_PER_FRAME } from './constants';

export interface WeaponConfig {
	damage: number;
	/** Seconds between shots — the fire *period*, not a rate. Cyclic RPM = 60 / fireRate. */
	fireRate: number;
	maxAmmo: number;
	reserveAmmo: number;
	reloadTime: number;
	/** true = full-auto (hold to fire); false = semi-auto (one shot per trigger press). */
	automatic: boolean;
}

/** Outcome of a single fire() call. `fired` is true only when a round discharged. */
export interface FireResult {
	fired: boolean;
	hit: boolean;
	enemyMesh: InstanceType<BabylonNamespace['AbstractMesh']> | null;
}

export interface WeaponSystem {
	ammo: number;
	reserveAmmo: number;
	maxAmmo: number;
	damage: number;
	reloading: boolean;
	hitMarkerActive: boolean;
	automatic: boolean;
	fire: () => FireResult;
	reload: () => void;
	update: (dt: number, triggerHeld: boolean) => void;
	reset: () => void;
	dispose: () => void;
}

export function createWeaponSystem(
	B: BabylonNamespace,
	scene: InstanceType<BabylonNamespace['Scene']>,
	player: PlayerController,
	vfx: VFXManager,
	gun: GunViewModel,
	config: WeaponConfig
): WeaponSystem {
	const MAX_AMMO = config.maxAmmo;
	const RESERVE_AMMO = config.reserveAmmo;
	const FIRE_RATE = config.fireRate;
	const RELOAD_TIME = config.reloadTime;
	let ammo = MAX_AMMO;
	let reserveAmmo = RESERVE_AMMO;
	let cooldown = 0;
	let reloading = false;
	let reloadTimer = 0;
	let hitMarkerActive = false;
	let hitMarkerTimer = 0;

	function fire(): FireResult {
		if (cooldown > 0 || reloading || ammo <= 0) {
			return { fired: false, hit: false, enemyMesh: null };
		}

		ammo--;
		cooldown += FIRE_RATE; // carry over negative remainder for accurate timing

		const ray = player.getForwardRay();

		// Gun recoil + muzzle flash from barrel tip
		gun.fireRecoil();
		vfx.muzzleFlash(gun.barrelTip, ray.direction);

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
				return { fired: true, hit: true, enemyMesh: pick.pickedMesh };
			}
		}

		if (ammo <= 0 && reserveAmmo > 0) {
			reload();
		}

		return { fired: true, hit: false, enemyMesh: null };
	}

	function reload() {
		if (reloading || ammo >= MAX_AMMO || reserveAmmo <= 0) return;
		reloading = true;
		reloadTimer = RELOAD_TIME;
		gun.reloadAnim();
	}

	function update(dt: number, triggerHeld: boolean) {
		// Advance the fire cooldown. While the trigger is genuinely held (and the
		// weapon can fire) it is allowed to go negative — each FIRE_RATE of negative
		// is one round "owed" this frame, which the game loop discharges via its
		// catch-up loop. That keeps the effective rate exact even when 1/FIRE_RATE
		// exceeds the frame rate. When idle or blocked we clamp at 0 so holding fire
		// later never dumps a banked burst; the floor caps catch-up after a stall.
		cooldown -= dt;
		const canFire = triggerHeld && !reloading && ammo > 0;
		if (!canFire) {
			if (cooldown < 0) cooldown = 0;
		} else if (cooldown < -FIRE_RATE * MAX_SHOTS_PER_FRAME) {
			cooldown = -FIRE_RATE * MAX_SHOTS_PER_FRAME;
		}

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
		get maxAmmo() { return MAX_AMMO; },
		get damage() { return config.damage; },
		get reloading() { return reloading; },
		get hitMarkerActive() { return hitMarkerActive; },
		get automatic() { return config.automatic; },
		fire,
		reload,
		update,
		reset,
		dispose
	};
}
