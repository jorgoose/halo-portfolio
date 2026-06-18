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
import { createGunViewModel, PRIMARY_GUN_CONFIG, SECONDARY_GUN_CONFIG } from './GunViewModel';
import type { GunViewModel } from './GunViewModel';
import type { WeaponConfig } from './WeaponSystem';
import { createHudState } from './HudState';
import {
	FOG_COLOR, FOG_DENSITY,
	WEAPON_DAMAGE, FIRE_RATE, MAX_AMMO, RESERVE_AMMO, RELOAD_TIME,
	SECONDARY_WEAPON_DAMAGE, SECONDARY_FIRE_RATE, SECONDARY_MAX_AMMO,
	SECONDARY_RESERVE_AMMO, SECONDARY_RELOAD_TIME,
	MAX_SHOTS_PER_FRAME
} from './constants';

const PRIMARY_WEAPON_CONFIG: WeaponConfig = {
	damage: WEAPON_DAMAGE,
	fireRate: FIRE_RATE,
	maxAmmo: MAX_AMMO,
	reserveAmmo: RESERVE_AMMO,
	reloadTime: RELOAD_TIME,
	automatic: true
};

const SECONDARY_WEAPON_CONFIG: WeaponConfig = {
	damage: SECONDARY_WEAPON_DAMAGE,
	fireRate: SECONDARY_FIRE_RATE,
	maxAmmo: SECONDARY_MAX_AMMO,
	reserveAmmo: SECONDARY_RESERVE_AMMO,
	reloadTime: SECONDARY_RELOAD_TIME,
	automatic: false
};

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
	// Enemies are on by default; ?enemies=off disables them (e.g. for perf debugging).
	const enemiesEnabled = enemiesParam !== 'off';

	// --- Engine & Scene ---
	const engine = await BABYLON.EngineFactory.CreateAsync(canvas, {
		stencil: true,
		antialias: false
	});
	const scene = new B.Scene(engine);
	scene.clearColor = new B.Color4(...FOG_COLOR, 1);
	scene.skipPointerMovePicking = true;
	// Initial render resolution; an adaptive controller (see render loop below)
	// tunes this at runtime to hold a smooth frame rate while reclaiming sharpness
	// whenever the GPU has headroom.
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
	const { spawnPoints } = await createArenaMap(B, scene);

	// --- Player ---
	const playerSpawn = spawnPoints.player[0];
	let player: PlayerController = createPlayerController(B, scene, canvas, playerSpawn);

	// --- Systems ---
	let healthShield: HealthShieldSystem = createHealthShieldSystem();
	const vfxManager: VFXManager = createVFXManager(B, scene, { lowQuality: true });

	// Primary weapon (assault rifle)
	const primaryGun: GunViewModel = await createGunViewModel(B, scene, player.camera, PRIMARY_GUN_CONFIG);
	const primaryWeapon: WeaponSystem = createWeaponSystem(B, scene, player, vfxManager, primaryGun, PRIMARY_WEAPON_CONFIG);

	// Secondary weapon (banana blaster)
	const secondaryGun: GunViewModel = await createGunViewModel(B, scene, player.camera, SECONDARY_GUN_CONFIG);
	const secondaryWeapon: WeaponSystem = createWeaponSystem(B, scene, player, vfxManager, secondaryGun, SECONDARY_WEAPON_CONFIG);
	secondaryGun.setVisible(false);

	const weaponNames = ['MA5B', 'BANANA BLASTER'];
	let activeWeaponIndex = 0;
	let gunViewModel: GunViewModel = primaryGun;
	let weapon: WeaponSystem = primaryWeapon;

	function switchWeapon(index: number) {
		if (index === activeWeaponIndex) return;
		// Hide current
		gunViewModel.setVisible(false);
		// Switch
		activeWeaponIndex = index;
		if (index === 0) {
			gunViewModel = primaryGun;
			weapon = primaryWeapon;
		} else {
			gunViewModel = secondaryGun;
			weapon = secondaryWeapon;
		}
		// Show new
		gunViewModel.setVisible(true);
		gunViewModel.reset();
		firing = false; // stop firing on switch
	}
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
	// Rising-edge flag: set on trigger press, consumed once per game frame. Drives
	// semi-auto weapons (one shot per press) without affecting full-auto.
	let triggerJustPressed = false;

	scene.onPointerObservable.add((pointerInfo) => {
		if (pointerInfo.type === B.PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 0) {
			firing = true;
			triggerJustPressed = true;
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
			if (kbInfo.event.code === 'Digit1' && !gameOver) {
				switchWeapon(0);
			}
			if (kbInfo.event.code === 'Digit2' && !gameOver) {
				switchWeapon(1);
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
					gunViewModel.setVisible(false);
					console.log('Debug freecam ON — WASD move, E/Q up/down, F3 to exit');
				} else {
					// Return to player camera
					debugCam.detachControl();
					debugCam.dispose();
					debugCam = null;
					scene.activeCamera = player.camera;
					player.camera.attachControl(canvas, true);
					gunViewModel.setVisible(true);
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
		// Only let the cooldown bank rounds (for catch-up) while a full-auto trigger
		// is genuinely held; semi-auto and idle just drain toward "ready".
		weapon.update(dt, firing && weapon.automatic);
		gunViewModel.update(dt);

		// Discharge rounds. Full-auto fires every round the cooldown owes this frame
		// (sub-frame catch-up, bounded by MAX_SHOTS_PER_FRAME) so the rate is exact at
		// any frame rate. Semi-auto fires once per trigger press (rising edge), still
		// gated by the cooldown inside fire().
		if (firing) {
			if (weapon.automatic) {
				for (let s = 0; s < MAX_SHOTS_PER_FRAME; s++) {
					const result = weapon.fire();
					if (!result.fired) break;
					if (result.hit && result.enemyMesh) {
						const killed = enemySystem.damageEnemy(result.enemyMesh, weapon.damage);
						if (killed) kills++;
					}
				}
			} else if (triggerJustPressed) {
				const result = weapon.fire();
				if (result.fired && result.hit && result.enemyMesh) {
					const killed = enemySystem.damageEnemy(result.enemyMesh, weapon.damage);
					if (killed) kills++;
				}
			}
		}
		triggerJustPressed = false;

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
			maxAmmo: weapon.maxAmmo,
			reserveAmmo: weapon.reserveAmmo,
			reloading: weapon.reloading,
			shieldRecharging: healthShield.shieldRecharging,
			kills,
			gameOver,
			weaponName: weaponNames[activeWeaponIndex]
		});
	});

	// --- Render Loop ---
	// Render once per vsync. The previous build gated this with a manual 16.67ms
	// timer, but rAF jitter on 60Hz panels regularly pushed the delta just under
	// the threshold and dropped a whole vsync — producing visible ~30fps judder.
	// All simulation is now delta-time based, so rendering every refresh is both
	// smooth and correct at 60/120/144Hz.

	// Adaptive resolution: defend the frame rate on weak GPUs, reclaim sharpness
	// on strong ones. hardwareScalingLevel is inverse to resolution (higher =
	// fewer pixels = blurrier but cheaper).
	const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
	// On dense displays, full backing-store resolution is wasteful; cap how sharp
	// we'll push so phones/Retina don't burn GPU/battery chasing invisible detail.
	const MIN_SCALE = dpr >= 2 ? Math.min(dpr * 0.6, 1.5) : 1.0; // sharpest allowed
	const MAX_SCALE = 2.0; // blurriest allowed — emergency floor to avoid lag
	let hwScale = 1.65;
	let lastAdaptAt = performance.now();

	function adaptResolution(now: number) {
		if (now - lastAdaptAt < 1000) return; // re-evaluate ~once per second
		lastAdaptAt = now;
		const fps = engine.getFps();
		if (!isFinite(fps) || fps <= 0) return;
		if (fps < 55 && hwScale < MAX_SCALE) {
			// Struggling — drop resolution quickly to recover headroom.
			hwScale = Math.min(MAX_SCALE, hwScale + 0.2);
			engine.setHardwareScalingLevel(hwScale);
		} else if (fps > 58 && hwScale > MIN_SCALE) {
			// Comfortable — reclaim sharpness gently to avoid visible popping.
			hwScale = Math.max(MIN_SCALE, hwScale - 0.1);
			engine.setHardwareScalingLevel(hwScale);
		}
	}

	engine.runRenderLoop(() => {
		if (disposed) return;
		adaptResolution(performance.now());
		scene.render();
	});

	const onResize = () => engine.resize();
	window.addEventListener('resize', onResize);

	// --- Public API ---
	function restart() {
		gameOver = false;
		paused = false;
		firing = false;
		triggerJustPressed = false;
		kills = 0;

		healthShield.reset();
		primaryWeapon.reset();
		secondaryWeapon.reset();
		primaryGun.reset();
		secondaryGun.reset();
		// Reset to primary weapon
		secondaryGun.setVisible(false);
		primaryGun.setVisible(true);
		activeWeaponIndex = 0;
		gunViewModel = primaryGun;
		weapon = primaryWeapon;
		enemySystem.reset();

		// Reset player position
		const sp = spawnPoints.player[0];
		player.camera.position.set(sp.x, sp.y, sp.z);

		canvas.requestPointerLock();

		hud.update({
			health: healthShield.health,
			shield: healthShield.shield,
			ammo: weapon.ammo,
			maxAmmo: weapon.maxAmmo,
			reserveAmmo: weapon.reserveAmmo,
			reloading: false,
			shieldRecharging: false,
			kills: 0,
			gameOver: false,
			paused: false,
			weaponName: weaponNames[0]
		});
	}

	function dispose() {
		disposed = true;
		document.removeEventListener('pointerlockchange', onPointerLockChange);
		window.removeEventListener('resize', onResize);
		hud.dispose?.();
		player.dispose();
		primaryGun.dispose();
		secondaryGun.dispose();
		enemySystem.dispose();
		vfxManager.dispose();
		primaryWeapon.dispose();
		secondaryWeapon.dispose();
		scene.dispose();
		engine.dispose();
	}

	return {
		dispose,
		restart,
		isPaused: () => paused
	};
}
