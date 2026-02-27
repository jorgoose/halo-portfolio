import type { Vector3, Scene, FreeCamera, Mesh, AbstractMesh } from '@babylonjs/core';

export interface SpawnPoints {
	player: { x: number; y: number; z: number }[];
	enemy: { x: number; y: number; z: number }[];
	nav: { x: number; y: number; z: number }[];
}

export interface ArenaMapResult {
	spawnPoints: SpawnPoints;
}

export interface HudSnapshot {
	health: number;
	maxHealth: number;
	shield: number;
	maxShield: number;
	ammo: number;
	maxAmmo: number;
	reserveAmmo: number;
	kills: number;
	reloading: boolean;
	shieldRecharging: boolean;
	gameOver: boolean;
	paused: boolean;
}

export type HudCallback = (snapshot: HudSnapshot) => void;

export enum EnemyState {
	IDLE = 'IDLE',
	PATROL = 'PATROL',
	CHASE = 'CHASE',
	ATTACK = 'ATTACK',
	DEAD = 'DEAD'
}

export interface EnemyData {
	mesh: Mesh;
	headMesh: Mesh;
	health: number;
	state: EnemyState;
	stateTimer: number;
	attackCooldown: number;
	currentNavIndex: number;
	respawnTimer: number;
	spawnIndex: number;
}

export interface DamageResult {
	shieldDamage: number;
	healthDamage: number;
	killed: boolean;
}

export interface GameSystems {
	scene: Scene;
	camera: FreeCamera;
	canvas: HTMLCanvasElement;
}

export interface BabylonNamespace {
	Engine: typeof import('@babylonjs/core').Engine;
	Scene: typeof import('@babylonjs/core').Scene;
	FreeCamera: typeof import('@babylonjs/core').FreeCamera;
	Vector3: typeof import('@babylonjs/core').Vector3;
	Color3: typeof import('@babylonjs/core').Color3;
	Color4: typeof import('@babylonjs/core').Color4;
	HemisphericLight: typeof import('@babylonjs/core').HemisphericLight;
	DirectionalLight: typeof import('@babylonjs/core').DirectionalLight;
	MeshBuilder: typeof import('@babylonjs/core').MeshBuilder;
	StandardMaterial: typeof import('@babylonjs/core').StandardMaterial;
	GlowLayer: typeof import('@babylonjs/core').GlowLayer;
	Ray: typeof import('@babylonjs/core').Ray;
	ParticleSystem: typeof import('@babylonjs/core').ParticleSystem;
	Texture: typeof import('@babylonjs/core').Texture;
	DynamicTexture: typeof import('@babylonjs/core').DynamicTexture;
	Mesh: typeof import('@babylonjs/core').Mesh;
	AbstractMesh: typeof import('@babylonjs/core').AbstractMesh;
	KeyboardEventTypes: typeof import('@babylonjs/core').KeyboardEventTypes;
	PointerEventTypes: typeof import('@babylonjs/core').PointerEventTypes;
	TransformNode: typeof import('@babylonjs/core').TransformNode;
	PointLight: typeof import('@babylonjs/core').PointLight;
}
