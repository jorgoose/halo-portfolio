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
		Scene: BABYLON.Scene,
		FreeCamera: BABYLON.FreeCamera,
		Vector3: BABYLON.Vector3,
		Color3: BABYLON.Color3,
		Color4: BABYLON.Color4,
		HemisphericLight: BABYLON.HemisphericLight,
		DirectionalLight: BABYLON.DirectionalLight,
		MeshBuilder: BABYLON.MeshBuilder,
		StandardMaterial: BABYLON.StandardMaterial,
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

	const enemiesParam =
		typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('enemies') : null;
	// Temporary perf mode: disable enemies by default; re-enable with ?enemies=on
	const enemiesEnabled = enemiesParam === 'on';

	// --- Engine & Scene ---
	const engine = await BABYLON.EngineFactory.CreateAsync(canvas, {
		stencil: true,
		antialias: false
	});
	const scene = new B.Scene(engine);
	scene.clearColor = new B.Color4(...FOG_COLOR, 1);
	scene.skipPointerMovePicking = true;
	engine.setHardwareScalingLevel(1.65);
	scene.performancePriority = BABYLON.ScenePerformancePriority.Aggressive;
	scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
	scene.fogDensity = FOG_DENSITY;
	scene.fogColor = new B.Color3(...FOG_COLOR);

	// --- Lighting (indoor) ---
	const hemiLight = new B.HemisphericLight('hemiLight', new B.Vector3(0, 1, 0), scene);
	hemiLight.intensity = 0.35;
	hemiLight.diffuse = new B.Color3(0.75, 0.72, 0.65);
	hemiLight.groundColor = new B.Color3(0.08, 0.07, 0.06);

	// Point lights for indoor illumination
	const pointLightDefs: [string, number, number][] = [
		['ptSouth', 0, -30],
		['ptHub', 0, 0],
		['ptNorth', 0, 30],
		['ptWestFlank', -29.5, 0],
		['ptEastFlank', 29.5, 0]
	];
	for (const [name, px, pz] of pointLightDefs) {
		const pl = new B.PointLight(name, new B.Vector3(px, 5.5, pz), scene);
		pl.intensity = 0.6;
		pl.range = 30;
		pl.diffuse = new B.Color3(0.95, 0.9, 0.8);
	}

	// --- Arena Map ---
	const { spawnPoints } = createArenaMap(B, scene);

	// --- Player ---
	const playerSpawn = spawnPoints.player[0];
	let player: PlayerController = createPlayerController(B, scene, canvas, playerSpawn);

	// --- Systems ---
	let healthShield: HealthShieldSystem = createHealthShieldSystem();
	const vfxManager: VFXManager = createVFXManager(B, scene, { lowQuality: true });
	let gunViewModel: GunViewModel = await createGunViewModel(B, scene, player.camera);
	let weapon: WeaponSystem = createWeaponSystem(B, scene, player, vfxManager, gunViewModel);
	let enemySystem: EnemySystem = enemiesEnabled
		? createEnemySystem(B, scene, spawnPoints, vfxManager, {
				lowQuality: false
			})
		: {
				enemies: [],
				update: () => 0,
				damageEnemy: () => false,
				reset: () => {},
				dispose: () => {}
			};
	// Octree for faster raycasting (O(log n) instead of O(n))
	await import('@babylonjs/core/Culling/Octrees/octreeSceneComponent');
	scene.createOrUpdateSelectionOctree(64, 2);

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

	let debugCam: InstanceType<BabylonNamespace['FreeCamera']> | null = null;

	scene.onKeyboardObservable.add((kbInfo) => {
		if (kbInfo.type === B.KeyboardEventTypes.KEYDOWN) {
			if (kbInfo.event.code === 'KeyR' && !gameOver) {
				weapon.reload();
			}
			if (kbInfo.event.code === 'F3') {
				kbInfo.event.preventDefault();
				if (!debugCam) {
					// Create debug freecam at current player position
					const pos = player.camera.position.clone();
					const rot = player.camera.rotation.clone();
					debugCam = new B.FreeCamera('debugCam', pos, scene);
					debugCam.rotation = rot;
					debugCam.minZ = 0.01;
					debugCam.speed = 0.5;
					debugCam.keysUp = [87];
					debugCam.keysDown = [83];
					debugCam.keysLeft = [65];
					debugCam.keysRight = [68];
					debugCam.keysUpward = [69]; // E
					debugCam.keysDownward = [81]; // Q
					debugCam.angularSensibility = 3000;
					scene.activeCamera = debugCam;
					debugCam.attachControl(canvas, true);
					player.camera.detachControl();
					console.log('Debug freecam ON — WASD move, E/Q up/down, F3 to exit');
				} else {
					// Return to player camera
					debugCam.detachControl();
					debugCam.dispose();
					debugCam = null;
					scene.activeCamera = player.camera;
					player.camera.attachControl(canvas, true);
					console.log('Debug freecam OFF');
				}
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

		// Clamp dt to avoid huge simulation steps when the browser stalls.
		const dt = Math.min(engine.getDeltaTime(), 50) / 1000;

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

		gunViewModel.setAmmo(weapon.ammo);

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
	let lastFrameAt = performance.now();
	const minFrameIntervalMs = 1000 / 60;
	engine.runRenderLoop(() => {
		const now = performance.now();
		if (now - lastFrameAt < minFrameIntervalMs) return;
		lastFrameAt += minFrameIntervalMs;
		if (now - lastFrameAt > minFrameIntervalMs) lastFrameAt = now;
		scene.render();
	});

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
		hud.dispose?.();
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
