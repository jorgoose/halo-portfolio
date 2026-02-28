import type { HudSnapshot, HudCallback } from './types';
import { MAX_HEALTH, MAX_SHIELD, MAX_AMMO, RESERVE_AMMO } from './constants';

export function createHudState(callback: HudCallback) {
	const THROTTLE_MS = 66; // ~15Hz for rapidly changing values
	const throttledKeys: (keyof HudSnapshot)[] = ['health', 'shield'];
	const immediateKeys: (keyof HudSnapshot)[] = [
		'ammo',
		'reserveAmmo',
		'reloading',
		'kills',
		'paused',
		'gameOver',
		'shieldRecharging'
	];
	const throttledKeySet = new Set(throttledKeys);
	const immediateKeySet = new Set(immediateKeys);

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

	let lastEmitAt = 0;
	let emitTimer: ReturnType<typeof setTimeout> | null = null;

	function emit() {
		lastEmitAt = performance.now();
		callback({ ...snapshot });
	}

	function scheduleEmit() {
		const now = performance.now();
		const elapsed = now - lastEmitAt;
		if (elapsed >= THROTTLE_MS) {
			if (emitTimer) {
				clearTimeout(emitTimer);
				emitTimer = null;
			}
			emit();
			return;
		}

		if (!emitTimer) {
			emitTimer = setTimeout(() => {
				emitTimer = null;
				emit();
			}, THROTTLE_MS - elapsed);
		}
	}

	function normalizeValue(key: keyof HudSnapshot, value: HudSnapshot[keyof HudSnapshot]) {
		if (key === 'health' || key === 'shield') {
			return Math.max(0, Math.round(value as number));
		}
		return value;
	}

	function update(data: Partial<HudSnapshot>) {
		let dirty = false;
		let forceImmediateEmit = false;
		let onlyThrottledKeysChanged = true;

		for (const key in data) {
			const typedKey = key as keyof HudSnapshot;
			const nextValue = normalizeValue(typedKey, data[typedKey] as HudSnapshot[keyof HudSnapshot]);
			if (snapshot[typedKey] !== nextValue) {
				(snapshot as HudSnapshot)[typedKey] = nextValue as never;
				dirty = true;
				if (immediateKeySet.has(typedKey)) {
					forceImmediateEmit = true;
				}
				if (!throttledKeySet.has(typedKey)) {
					onlyThrottledKeysChanged = false;
				}
			}
		}

		if (!dirty) return;
		if (forceImmediateEmit || !onlyThrottledKeysChanged) {
			if (emitTimer) {
				clearTimeout(emitTimer);
				emitTimer = null;
			}
			emit();
			return;
		}
		scheduleEmit();
	}

	function dispose() {
		if (emitTimer) {
			clearTimeout(emitTimer);
			emitTimer = null;
		}
	}

	return { snapshot, update, emit, dispose };
}
