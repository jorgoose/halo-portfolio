import type { DamageResult } from './types';
import {
	MAX_HEALTH,
	MAX_SHIELD,
	SHIELD_RECHARGE_DELAY,
	SHIELD_RECHARGE_RATE
} from './constants';

export interface HealthShieldSystem {
	health: number;
	shield: number;
	shieldRecharging: boolean;
	takeDamage: (amount: number) => DamageResult;
	update: (dt: number) => void;
	reset: () => void;
}

export function createHealthShieldSystem(): HealthShieldSystem {
	let health = MAX_HEALTH;
	let shield = MAX_SHIELD;
	let timeSinceLastDamage = 999;
	let shieldRecharging = false;

	function takeDamage(amount: number): DamageResult {
		timeSinceLastDamage = 0;
		shieldRecharging = false;

		let shieldDamage = 0;
		let healthDamage = 0;

		if (shield > 0) {
			shieldDamage = Math.min(shield, amount);
			shield -= shieldDamage;
			amount -= shieldDamage;
		}

		if (amount > 0) {
			healthDamage = Math.min(health, amount);
			health -= healthDamage;
		}

		return {
			shieldDamage,
			healthDamage,
			killed: health <= 0
		};
	}

	function update(dt: number) {
		timeSinceLastDamage += dt;

		if (timeSinceLastDamage >= SHIELD_RECHARGE_DELAY && shield < MAX_SHIELD) {
			shieldRecharging = true;
			shield = Math.min(MAX_SHIELD, shield + SHIELD_RECHARGE_RATE * dt);
		} else if (shield >= MAX_SHIELD) {
			shieldRecharging = false;
		}
	}

	function reset() {
		health = MAX_HEALTH;
		shield = MAX_SHIELD;
		timeSinceLastDamage = 999;
		shieldRecharging = false;
	}

	return {
		get health() { return health; },
		get shield() { return shield; },
		get shieldRecharging() { return shieldRecharging; },
		takeDamage,
		update,
		reset
	};
}
