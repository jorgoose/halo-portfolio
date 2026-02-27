// Player
export const PLAYER_SPEED = 0.18;
export const PLAYER_SPRINT_SPEED = 0.28;
export const MOUSE_SENSITIVITY = 3000;
export const GRAVITY = -0.5;
export const COLLISION_ELLIPSOID = { x: 0.5, y: 1.0, z: 0.5 };
export const PLAYER_HEIGHT = 2.4;
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
export const ENEMY_DETECT_RANGE = 50;
export const ENEMY_ATTACK_RANGE = 40;
export const ENEMY_MELEE_RANGE = 3;
export const MAX_ENEMIES = 6;
export const ENEMY_RESPAWN_TIME = 5.0; // seconds

// Arena
export const ARENA_SIZE = 200;
export const WALL_HEIGHT = 8;
export const PLATFORM_HEIGHT = 2.5;
export const COVER_HEIGHT = 1.4;
export const BASE_HEIGHT = 8;

// Colors (as RGB arrays for Babylon Color3)
export const COLOR_AMBER = [1.0, 0.7, 0.2] as const; // warm Forerunner gold
export const COLOR_BLUE_ACCENT = [0.3, 0.4, 0.8] as const;
export const COLOR_DARK_METAL = [0.15, 0.16, 0.18] as const; // silver-grey
export const COLOR_FLOOR = [0.1, 0.11, 0.13] as const;
export const COLOR_FORERUNNER_SILVER = [0.5, 0.52, 0.55] as const;
export const COLOR_SHIELD_CYAN = [0.37, 0.76, 1.0] as const; // preserved for shield VFX
export const COLOR_ENEMY_RED = [1.0, 0.2, 0.1] as const;
export const COLOR_ORANGE = [1.0, 0.6, 0.1] as const;

// Outdoor colors
export const COLOR_GROUND_GRASS = [0.22, 0.32, 0.18] as const;
export const COLOR_ROCK = [0.35, 0.33, 0.3] as const;
export const COLOR_CLIFF = [0.28, 0.26, 0.22] as const;
export const COLOR_WATER = [0.15, 0.3, 0.45] as const;

// Sky gradient
export const SKY_ZENITH = '#4073d9';
export const SKY_MID = '#78aae6';
export const SKY_HORIZON = '#a6c0e1';
export const SKY_BOTTOM = '#8c9eb8';

// Fog
export const FOG_DENSITY = 0.0015;
export const FOG_COLOR = [0.55, 0.62, 0.72] as const;

// VFX
export const MUZZLE_FLASH_DURATION = 0.05;
export const HIT_MARKER_DURATION = 0.15;
export const DEATH_PARTICLE_COUNT = 30;
