// Player
export const PLAYER_SPEED = 0.5;
export const PLAYER_SPRINT_SPEED = 0.8;
export const MOUSE_SENSITIVITY = 3000;
export const GRAVITY = -0.5;
export const COLLISION_ELLIPSOID = { x: 0.5, y: 0.8, z: 0.5 };
export const PLAYER_HEIGHT = 1.6;
export const NEAR_CLIP = 0.1;
export const VERTICAL_LOOK_LIMIT = 1.48; // ~85 degrees

// Health & Shield
export const MAX_HEALTH = 100;
export const MAX_SHIELD = 100;
export const SHIELD_RECHARGE_DELAY = 4.0; // seconds
export const SHIELD_RECHARGE_RATE = 30; // per second

// Weapon
export const WEAPON_DAMAGE = 25;
export const FIRE_RATE = 0.15; // seconds between shots
export const MAX_AMMO = 32;
export const RESERVE_AMMO = 96;
export const RELOAD_TIME = 1.5; // seconds

// Enemies
export const ENEMY_HEALTH = 100;
export const ENEMY_DAMAGE = 10;
export const ENEMY_FIRE_RATE = 1.0; // seconds between shots
export const ENEMY_SPEED = 0.06;
export const ENEMY_DETECT_RANGE = 20;
export const ENEMY_ATTACK_RANGE = 15;
export const ENEMY_MELEE_RANGE = 3;
export const MAX_ENEMIES = 4;
export const ENEMY_RESPAWN_TIME = 5.0; // seconds

// Arena
export const ARENA_SIZE = 40;
export const WALL_HEIGHT = 6;
export const PLATFORM_HEIGHT = 2;
export const COVER_HEIGHT = 1.2;

// Colors (as RGB arrays for Babylon Color3)
export const COLOR_CYAN = [0.37, 0.76, 1.0] as const; // #5ec3ff
export const COLOR_BLUE = [0.1, 0.46, 0.82] as const; // #1976d2
export const COLOR_DARK_METAL = [0.06, 0.08, 0.12] as const;
export const COLOR_FLOOR = [0.04, 0.05, 0.08] as const;
export const COLOR_ENEMY_RED = [1.0, 0.2, 0.1] as const;
export const COLOR_ORANGE = [1.0, 0.6, 0.1] as const;

// Fog
export const FOG_DENSITY = 0.015;
export const FOG_COLOR = [0.02, 0.03, 0.06] as const;

// VFX
export const MUZZLE_FLASH_DURATION = 0.05;
export const HIT_MARKER_DURATION = 0.15;
export const DEATH_PARTICLE_COUNT = 30;
