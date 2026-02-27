import type { BabylonNamespace, HudCallback } from './types';
import { createArenaMap } from './ArenaMap';
import { createPlayerController } from './PlayerController';
import type { PlayerController } from './PlayerController';
import { createHealthShieldSystem } from './HealthShieldSystem';
import type { HealthShieldSystem } from './HealthShieldSystem';
import { createWeaponSystem } from './WeaponSystem';
import type { WeaponSystem } from './WeaponSystem';
import { createEnemySystem } from './EnemySystem';
import type { EnemySystem } from './EnemySystem';
import { createVFXManager } from './VFXManager';
import type { VFXManager } from './VFXManager';
import { createGunViewModel } from './GunViewModel';
import type { GunViewModel } from './GunViewModel';
import { createHudState } from './HudState';
import { FOG_COLOR, FOG_DENSITY, WEAPON_DAMAGE } from './constants';

export interface GameManager {
	dispose: () => void;
	restart: () => void;
	isPaused: () => boolean;
}

export async function initGameManager(
	canvas: HTMLCanvasElement,
	hudCallback: HudCallback
): Promise<GameManager> {
	// Dynamic import of Babylon.js
	const BABYLON = await import('@babylonjs/core');

	const B: BabylonNamespace = {
		Engine: BABYLON.Engine,
		Scene: BABYLON.Scene,
		FreeCamera: BABYLON.FreeCamera,
		Vector3: BABYLON.Vector3,
		Color3: BABYLON.Color3,
		Color4: BABYLON.Color4,
		HemisphericLight: BABYLON.HemisphericLight,
		DirectionalLight: BABYLON.DirectionalLight,
		MeshBuilder: BABYLON.MeshBuilder,
		StandardMaterial: BABYLON.StandardMaterial,
		GlowLayer: BABYLON.GlowLayer,
		Ray: BABYLON.Ray,
		ParticleSystem: BABYLON.ParticleSystem,
		Texture: BABYLON.Texture,
		DynamicTexture: BABYLON.DynamicTexture,
		Mesh: BABYLON.Mesh,
		AbstractMesh: BABYLON.AbstractMesh,
		KeyboardEventTypes: BABYLON.KeyboardEventTypes,
		PointerEventTypes: BABYLON.PointerEventTypes,
		TransformNode: BABYLON.TransformNode,
		PointLight: BABYLON.PointLight
	};

	// --- Engine & Scene ---
	const engine = new B.Engine(canvas, true, { stencil: true });
	const scene = new B.Scene(engine);
	scene.clearColor = new B.Color4(...FOG_COLOR, 1);

	// Fog
	scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
	scene.fogDensity = FOG_DENSITY;
	scene.fogColor = new B.Color3(...FOG_COLOR);

	// Glow layer
	const glowLayer = new B.GlowLayer('glow', scene, { blurKernelSize: 32 });
	glowLayer.intensity = 0.3;

	// --- Lighting ---
	const hemiLight = new B.HemisphericLight('hemiLight', new B.Vector3(0, 1, 0), scene);
	hemiLight.intensity = 0.7;
	hemiLight.diffuse = new B.Color3(0.85, 0.88, 0.95);
	hemiLight.groundColor = new B.Color3(0.25, 0.22, 0.18);

	const dirLight = new B.DirectionalLight('dirLight', new B.Vector3(-0.5, -1, 0.5), scene);
	dirLight.intensity = 0.8;
	dirLight.diffuse = new B.Color3(1.0, 0.95, 0.85);

	// Monument point light at center
	const centerLight = new B.PointLight('centerLight', new B.Vector3(0, 8, 0), scene);
	centerLight.intensity = 0.4;
	centerLight.diffuse = new B.Color3(1.0, 0.7, 0.2);
	centerLight.range = 40;

	// --- Arena Map ---
	const { spawnPoints } = createArenaMap(B, scene);

	// --- Player ---
	const playerSpawn = spawnPoints.player[0];
	let player: PlayerController = createPlayerController(B, scene, canvas, playerSpawn);

	// --- Systems ---
	let healthShield: HealthShieldSystem = createHealthShieldSystem();
	const vfxManager: VFXManager = createVFXManager(B, scene);
	let gunViewModel: GunViewModel = await createGunViewModel(B, scene, player.camera);
	let weapon: WeaponSystem = createWeaponSystem(B, scene, player, vfxManager, gunViewModel);
	let enemySystem: EnemySystem = createEnemySystem(B, scene, spawnPoints, vfxManager);
	const hud = createHudState(hudCallback);

	let kills = 0;
	let gameOver = false;
	let paused = false;
	let disposed = false;

	// --- Input ---
	let firing = false;

	scene.onPointerObservable.add((pointerInfo) => {
		if (pointerInfo.type === B.PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 0) {
			firing = true;
		}
		if (pointerInfo.type === B.PointerEventTypes.POINTERUP && pointerInfo.event.button === 0) {
			firing = false;
		}
	});

	scene.onKeyboardObservable.add((kbInfo) => {
		if (kbInfo.type === B.KeyboardEventTypes.KEYDOWN) {
			if (kbInfo.event.code === 'KeyR' && !gameOver) {
				weapon.reload();
			}
		}
	});

	// --- Pointer Lock Change (pause) ---
	const onPointerLockChange = () => {
		if (disposed || gameOver) return;
		const isLocked = document.pointerLockElement === canvas;
		paused = !isLocked;
		hud.update({ paused });
	};
	document.addEventListener('pointerlockchange', onPointerLockChange);

	// --- Game Loop ---
	scene.registerBeforeRender(() => {
		if (gameOver || paused) return;

		const dt = engine.getDeltaTime() / 1000;

		healthShield.update(dt);
		weapon.update(dt);
		gunViewModel.update(dt);

		// Full-auto: fire every frame while mouse held (cooldown gates rate)
		if (firing) {
			const result = weapon.fire();
			if (result.hit && result.enemyMesh) {
				const killed = enemySystem.damageEnemy(result.enemyMesh, WEAPON_DAMAGE);
				if (killed) kills++;
			}
		}

		const playerDamage = enemySystem.update(dt, player.getPosition());

		if (playerDamage > 0) {
			const result = healthShield.takeDamage(playerDamage);
			if (result.shieldDamage > 0) {
				vfxManager.shieldFlare(player.camera);
			}
			if (result.killed) {
				gameOver = true;
				document.exitPointerLock();
			}
		}

		hud.update({
			health: healthShield.health,
			shield: healthShield.shield,
			ammo: weapon.ammo,
			reserveAmmo: weapon.reserveAmmo,
			reloading: weapon.reloading,
			shieldRecharging: healthShield.shieldRecharging,
			kills,
			gameOver
		});
	});

	// --- Render Loop ---
	engine.runRenderLoop(() => scene.render());

	const onResize = () => engine.resize();
	window.addEventListener('resize', onResize);

	// --- Public API ---
	function restart() {
		gameOver = false;
		paused = false;
		firing = false;
		kills = 0;

		healthShield.reset();
		weapon.reset();
		gunViewModel.reset();
		enemySystem.reset();

		// Reset player position
		const sp = spawnPoints.player[0];
		player.camera.position.set(sp.x, sp.y, sp.z);

		canvas.requestPointerLock();

		hud.update({
			health: healthShield.health,
			shield: healthShield.shield,
			ammo: weapon.ammo,
			reserveAmmo: weapon.reserveAmmo,
			reloading: false,
			shieldRecharging: false,
			kills: 0,
			gameOver: false,
			paused: false
		});
	}

	function dispose() {
		disposed = true;
		document.removeEventListener('pointerlockchange', onPointerLockChange);
		window.removeEventListener('resize', onResize);
		player.dispose();
		gunViewModel.dispose();
		enemySystem.dispose();
		vfxManager.dispose();
		weapon.dispose();
		scene.dispose();
		engine.dispose();
	}

	return {
		dispose,
		restart,
		isPaused: () => paused
	};
}
