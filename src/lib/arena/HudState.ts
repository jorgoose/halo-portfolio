import type { HudSnapshot, HudCallback } from './types';
import { MAX_HEALTH, MAX_SHIELD, MAX_AMMO, RESERVE_AMMO } from './constants';

export function createHudState(callback: HudCallback) {
	const snapshot: HudSnapshot = {
		health: MAX_HEALTH,
		maxHealth: MAX_HEALTH,
		shield: MAX_SHIELD,
		maxShield: MAX_SHIELD,
		ammo: MAX_AMMO,
		maxAmmo: MAX_AMMO,
		reserveAmmo: RESERVE_AMMO,
		kills: 0,
		reloading: false,
		shieldRecharging: false,
		gameOver: false,
		paused: false
	};

	function emit() {
		callback({ ...snapshot });
	}

	function update(data: Partial<HudSnapshot>) {
		Object.assign(snapshot, data);
		emit();
	}

	return { snapshot, update, emit };
}
