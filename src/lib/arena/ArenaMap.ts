import type { BabylonNamespace, ArenaMapResult } from './types';
import {
	ARENA_SIZE,
	WALL_HEIGHT,
	PLATFORM_HEIGHT,
	COVER_HEIGHT,
	COLOR_CYAN,
	COLOR_BLUE,
	COLOR_DARK_METAL,
	COLOR_FLOOR
} from './constants';

export function createArenaMap(
	B: BabylonNamespace,
	scene: InstanceType<BabylonNamespace['Scene']>
): ArenaMapResult {
	const half = ARENA_SIZE / 2;

	// --- Materials ---
	const floorMat = new B.StandardMaterial('floorMat', scene);
	floorMat.diffuseColor = new B.Color3(...COLOR_FLOOR);
	floorMat.specularColor = new B.Color3(0.1, 0.1, 0.15);
	floorMat.emissiveColor = new B.Color3(0.01, 0.015, 0.03);

	const wallMat = new B.StandardMaterial('wallMat', scene);
	wallMat.diffuseColor = new B.Color3(...COLOR_DARK_METAL);
	wallMat.specularColor = new B.Color3(0.15, 0.15, 0.2);
	wallMat.emissiveColor = new B.Color3(0.02, 0.03, 0.05);

	const cyanGlow = new B.StandardMaterial('cyanGlow', scene);
	cyanGlow.emissiveColor = new B.Color3(...COLOR_CYAN);
	cyanGlow.diffuseColor = new B.Color3(0, 0, 0);
	cyanGlow.alpha = 0.9;

	const blueGlow = new B.StandardMaterial('blueGlow', scene);
	blueGlow.emissiveColor = new B.Color3(...COLOR_BLUE);
	blueGlow.diffuseColor = new B.Color3(0, 0, 0);

	const platformMat = new B.StandardMaterial('platformMat', scene);
	platformMat.diffuseColor = new B.Color3(0.08, 0.1, 0.15);
	platformMat.specularColor = new B.Color3(0.1, 0.12, 0.18);
	platformMat.emissiveColor = new B.Color3(0.02, 0.03, 0.06);

	const coverMat = new B.StandardMaterial('coverMat', scene);
	coverMat.diffuseColor = new B.Color3(0.07, 0.09, 0.13);
	coverMat.specularColor = new B.Color3(0.1, 0.1, 0.15);
	coverMat.emissiveColor = new B.Color3(0.015, 0.025, 0.05);

	// --- Floor ---
	const floor = B.MeshBuilder.CreateGround('floor', { width: ARENA_SIZE, height: ARENA_SIZE }, scene);
	floor.material = floorMat;
	floor.checkCollisions = true;
	floor.receiveShadows = true;

	// Floor grid lines for visual detail
	for (let i = -half; i <= half; i += 4) {
		const lineX = B.MeshBuilder.CreateBox(`gridX_${i}`, { width: ARENA_SIZE, height: 0.02, depth: 0.03 }, scene);
		lineX.position.set(0, 0.01, i);
		lineX.material = cyanGlow;
		lineX.isPickable = false;

		const lineZ = B.MeshBuilder.CreateBox(`gridZ_${i}`, { width: 0.03, height: 0.02, depth: ARENA_SIZE }, scene);
		lineZ.position.set(i, 0.01, 0);
		lineZ.material = cyanGlow;
		lineZ.isPickable = false;
	}

	// --- Perimeter Walls ---
	const wallPositions: [number, number, number, number, number][] = [
		// x, z, width, depth, rotY(unused, walls are axis-aligned)
		[0, -half, ARENA_SIZE + 1, 1, 0], // north
		[0, half, ARENA_SIZE + 1, 1, 0], // south
		[-half, 0, 1, ARENA_SIZE + 1, 0], // west
		[half, 0, 1, ARENA_SIZE + 1, 0] // east
	];

	wallPositions.forEach(([x, z, w, d], i) => {
		const wall = B.MeshBuilder.CreateBox(`wall_${i}`, { width: w, height: WALL_HEIGHT, depth: d }, scene);
		wall.position.set(x, WALL_HEIGHT / 2, z);
		wall.material = wallMat;
		wall.checkCollisions = true;

		// Cyan trim on top
		const trim = B.MeshBuilder.CreateBox(`wallTrim_${i}`, { width: w, height: 0.1, depth: d + 0.1 }, scene);
		trim.position.set(x, WALL_HEIGHT, z);
		trim.material = cyanGlow;
		trim.isPickable = false;
	});

	// --- Corner Platforms with Ramps ---
	const corners: [number, number][] = [
		[-half + 4, -half + 4],
		[half - 4, -half + 4],
		[-half + 4, half - 4],
		[half - 4, half - 4]
	];

	corners.forEach(([cx, cz], i) => {
		// Platform top
		const plat = B.MeshBuilder.CreateBox(`platform_${i}`, { width: 6, height: PLATFORM_HEIGHT, depth: 6 }, scene);
		plat.position.set(cx, PLATFORM_HEIGHT / 2, cz);
		plat.material = platformMat;
		plat.checkCollisions = true;

		// Platform edge glow
		const edgeTrim = B.MeshBuilder.CreateBox(`platTrim_${i}`, { width: 6.2, height: 0.08, depth: 6.2 }, scene);
		edgeTrim.position.set(cx, PLATFORM_HEIGHT, cz);
		edgeTrim.material = cyanGlow;
		edgeTrim.isPickable = false;

		// Ramp facing center
		const rampDir = new B.Vector3(-Math.sign(cx), 0, -Math.sign(cz)).normalize();
		const ramp = B.MeshBuilder.CreateBox(`ramp_${i}`, { width: 2.5, height: 0.15, depth: 4 }, scene);
		const rampX = cx + rampDir.x * 4;
		const rampZ = cz + rampDir.z * 4;
		ramp.position.set(rampX, PLATFORM_HEIGHT / 2, rampZ);
		// Tilt ramp - rotate to slope from floor to platform height
		const angleDiag = Math.atan2(PLATFORM_HEIGHT, 4);
		if (Math.abs(rampDir.x) > Math.abs(rampDir.z)) {
			ramp.rotation.z = rampDir.x > 0 ? angleDiag : -angleDiag;
		} else {
			ramp.rotation.x = rampDir.z > 0 ? -angleDiag : angleDiag;
		}
		ramp.material = platformMat;
		ramp.checkCollisions = true;
	});

	// --- Cover Blocks ---
	const coverPositions: [number, number][] = [
		[-6, -6],
		[6, -6],
		[-6, 6],
		[6, 6]
	];

	coverPositions.forEach(([x, z], i) => {
		const cover = B.MeshBuilder.CreateBox(`cover_${i}`, { width: 2.5, height: COVER_HEIGHT, depth: 2.5 }, scene);
		cover.position.set(x, COVER_HEIGHT / 2, z);
		cover.material = coverMat;
		cover.checkCollisions = true;

		// Blue glow strip on top
		const strip = B.MeshBuilder.CreateBox(`coverStrip_${i}`, { width: 2.6, height: 0.06, depth: 0.15 }, scene);
		strip.position.set(x, COVER_HEIGHT, z);
		strip.material = blueGlow;
		strip.isPickable = false;
	});

	// --- Center Platform with Pillar ---
	const centerPlat = B.MeshBuilder.CreateBox('centerPlatform', { width: 5, height: 0.6, depth: 5 }, scene);
	centerPlat.position.set(0, 0.3, 0);
	centerPlat.material = platformMat;
	centerPlat.checkCollisions = true;

	const centerPlatTrim = B.MeshBuilder.CreateBox('centerPlatTrim', { width: 5.2, height: 0.06, depth: 5.2 }, scene);
	centerPlatTrim.position.set(0, 0.6, 0);
	centerPlatTrim.material = cyanGlow;
	centerPlatTrim.isPickable = false;

	const pillar = B.MeshBuilder.CreateCylinder('pillar', { height: 4, diameter: 1, tessellation: 8 }, scene);
	pillar.position.set(0, 2.6, 0);
	pillar.material = wallMat;
	pillar.checkCollisions = true;

	const pillarRing = B.MeshBuilder.CreateTorus('pillarRing', { diameter: 1.5, thickness: 0.08, tessellation: 16 }, scene);
	pillarRing.position.set(0, 4.6, 0);
	pillarRing.material = cyanGlow;
	pillarRing.isPickable = false;

	// --- Additional cover along sides ---
	const sideCovers: [number, number, number, number][] = [
		[0, -10, 3, 1.5],
		[0, 10, 3, 1.5],
		[-10, 0, 1.5, 3],
		[10, 0, 1.5, 3]
	];

	sideCovers.forEach(([x, z, w, d], i) => {
		const sc = B.MeshBuilder.CreateBox(`sideCover_${i}`, { width: w, height: COVER_HEIGHT * 1.2, depth: d }, scene);
		sc.position.set(x, (COVER_HEIGHT * 1.2) / 2, z);
		sc.material = coverMat;
		sc.checkCollisions = true;
	});

	// --- Spawn & Nav Points ---
	const spawnPoints = {
		player: [
			{ x: -half + 3, y: 1.6, z: -half + 3 },
			{ x: half - 3, y: 1.6, z: half - 3 }
		],
		enemy: [
			{ x: half - 5, y: 0.5, z: -half + 5 },
			{ x: -half + 5, y: 0.5, z: half - 5 },
			{ x: half - 5, y: 0.5, z: half - 5 },
			{ x: -half + 5, y: 0.5, z: -half + 5 }
		],
		nav: [
			{ x: -8, y: 0.5, z: -8 },
			{ x: 8, y: 0.5, z: -8 },
			{ x: 8, y: 0.5, z: 8 },
			{ x: -8, y: 0.5, z: 8 },
			{ x: 0, y: 0.5, z: -12 },
			{ x: 12, y: 0.5, z: 0 },
			{ x: 0, y: 0.5, z: 12 },
			{ x: -12, y: 0.5, z: 0 }
		]
	};

	return { spawnPoints };
}
