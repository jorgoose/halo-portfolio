// Player
export const PLAYER_SPEED = 0.18;
export const PLAYER_SPRINT_SPEED = 0.28;
export const MOUSE_SENSITIVITY = 3000;
export const GRAVITY_ACCEL = -0.006;
export const COLLISION_ELLIPSOID = { x: 0.5, y: 1.0, z: 0.5 };
export const PLAYER_HEIGHT = 2.4;
export const NEAR_CLIP = 0.1;
export const VERTICAL_LOOK_LIMIT = 1.48; // ~85 degrees
export const JUMP_VELOCITY = 0.04;

// Health & Shield
export const MAX_HEALTH = 100;
export const MAX_SHIELD = 100;
export const SHIELD_RECHARGE_DELAY = 4.0; // seconds
export const SHIELD_RECHARGE_RATE = 30; // per second

// Weapon
export const WEAPON_DAMAGE = 25;
export const FIRE_RATE = 0.067; // ~900 RPM, matches Halo CE MA5B
export const MAX_AMMO = 60;
export const RESERVE_AMMO = 180;
export const RELOAD_TIME = 1.5; // seconds

// Enemies
export const ENEMY_HEALTH = 100;
export const ENEMY_DAMAGE = 10;
export const ENEMY_FIRE_RATE = 1.0; // seconds between shots
export const ENEMY_SPEED = 0.06;
export const ENEMY_DETECT_RANGE = 35;
export const ENEMY_ATTACK_RANGE = 28;
export const ENEMY_MELEE_RANGE = 3;
export const MAX_ENEMIES = 6;
export const ENEMY_RESPAWN_TIME = 5.0; // seconds

// Arena
export const ARENA_SIZE = 120;
export const ARENA_WIDTH = 80;
export const WALL_HEIGHT = 6;
export const CEILING_HEIGHT = 6;
export const COVER_HEIGHT = 1.4;
export const CORRIDOR_WIDTH = 8;
export const FLANK_WIDTH = 6;
export const DOOR_WIDTH = 4;
export const DOOR_HEIGHT = 5.5;
export const WALL_THICKNESS = 0.5;

// Colors (as RGB arrays for Babylon Color3)
export const COLOR_AMBER = [1.0, 0.7, 0.2] as const; // warm Forerunner gold
export const COLOR_BLUE_ACCENT = [0.3, 0.4, 0.8] as const;
export const COLOR_DARK_METAL = [0.15, 0.16, 0.18] as const;
export const COLOR_FLOOR = [0.12, 0.13, 0.15] as const;
export const COLOR_FORERUNNER_SILVER = [0.5, 0.52, 0.55] as const;
export const COLOR_SHIELD_CYAN = [0.37, 0.76, 1.0] as const; // preserved for shield VFX
export const COLOR_ENEMY_RED = [1.0, 0.2, 0.1] as const;
export const COLOR_ORANGE = [1.0, 0.6, 0.1] as const;

// Indoor colors
export const COLOR_WALL = [0.38, 0.40, 0.43] as const;
export const COLOR_CEILING = [0.28, 0.29, 0.31] as const;
export const COLOR_PILLAR = [0.30, 0.31, 0.33] as const;
export const COLOR_DOORFRAME = [0.22, 0.23, 0.25] as const;
export const COLOR_CRATE = [0.20, 0.22, 0.18] as const;
export const COLOR_BARRICADE = [0.25, 0.26, 0.28] as const;
export const COLOR_CEILING_LIGHT = [0.9, 0.88, 0.82] as const;

// Fog
export const FOG_DENSITY = 0.008;
export const FOG_COLOR = [0.05, 0.05, 0.07] as const;

// VFX
export const MUZZLE_FLASH_DURATION = 0.05;
export const HIT_MARKER_DURATION = 0.15;
export const DEATH_PARTICLE_COUNT = 30;
