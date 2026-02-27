import type { BabylonNamespace, ArenaMapResult } from './types';
import {
	ARENA_SIZE,
	WALL_HEIGHT,
	PLATFORM_HEIGHT,
	COVER_HEIGHT,
	COLOR_AMBER,
	COLOR_BLUE_ACCENT,
	COLOR_DARK_METAL,
	COLOR_FLOOR,
	COLOR_FORERUNNER_SILVER
} from './constants';

export function createArenaMap(
	B: BabylonNamespace,
	scene: InstanceType<BabylonNamespace['Scene']>
): ArenaMapResult {
	const half = ARENA_SIZE / 2;

	// --- Materials ---
	const floorMat = new B.StandardMaterial('floorMat', scene);
	floorMat.diffuseColor = new B.Color3(...COLOR_FLOOR);
	floorMat.specularColor = new B.Color3(0.12, 0.12, 0.12);
	floorMat.emissiveColor = new B.Color3(0.01, 0.01, 0.012);

	const wallMat = new B.StandardMaterial('wallMat', scene);
	wallMat.diffuseColor = new B.Color3(...COLOR_DARK_METAL);
	wallMat.specularColor = new B.Color3(0.18, 0.18, 0.17);
	wallMat.emissiveColor = new B.Color3(0.03, 0.03, 0.03);

	const amberGlow = new B.StandardMaterial('amberGlow', scene);
	amberGlow.emissiveColor = new B.Color3(...COLOR_AMBER);
	amberGlow.diffuseColor = new B.Color3(0, 0, 0);
	amberGlow.alpha = 0.9;

	const blueAccent = new B.StandardMaterial('blueAccent', scene);
	blueAccent.emissiveColor = new B.Color3(...COLOR_BLUE_ACCENT);
	blueAccent.diffuseColor = new B.Color3(0, 0, 0);

	const platformMat = new B.StandardMaterial('platformMat', scene);
	platformMat.diffuseColor = new B.Color3(0.12, 0.12, 0.13);
	platformMat.specularColor = new B.Color3(0.15, 0.15, 0.14);
	platformMat.emissiveColor = new B.Color3(0.02, 0.02, 0.02);

	const coverMat = new B.StandardMaterial('coverMat', scene);
	coverMat.diffuseColor = new B.Color3(0.11, 0.11, 0.12);
	coverMat.specularColor = new B.Color3(0.13, 0.13, 0.12);
	coverMat.emissiveColor = new B.Color3(0.015, 0.015, 0.015);

	const seamMat = new B.StandardMaterial('seamMat', scene);
	seamMat.diffuseColor = new B.Color3(0.05, 0.05, 0.06);
	seamMat.specularColor = new B.Color3(0, 0, 0);
	seamMat.emissiveColor = new B.Color3(0, 0, 0);

	const silverMat = new B.StandardMaterial('silverMat', scene);
	silverMat.diffuseColor = new B.Color3(...COLOR_FORERUNNER_SILVER);
	silverMat.specularColor = new B.Color3(0.4, 0.4, 0.38);
	silverMat.emissiveColor = new B.Color3(0.06, 0.06, 0.058);

	const hardLightMat = new B.StandardMaterial('hardLightMat', scene);
	hardLightMat.emissiveColor = new B.Color3(...COLOR_AMBER);
	hardLightMat.diffuseColor = new B.Color3(0, 0, 0);
	hardLightMat.alpha = 0.3;
	hardLightMat.backFaceCulling = false;

	// --- Floor ---
	const floor = B.MeshBuilder.CreateGround('floor', { width: ARENA_SIZE, height: ARENA_SIZE }, scene);
	floor.material = floorMat;
	floor.checkCollisions = true;
	floor.receiveShadows = true;

	// Subtle dark panel seam lines (every 8 units, not 4)
	for (let i = -half; i <= half; i += 8) {
		const lineX = B.MeshBuilder.CreateBox(`seamX_${i}`, { width: ARENA_SIZE, height: 0.02, depth: 0.04 }, scene);
		lineX.position.set(0, 0.01, i);
		lineX.material = seamMat;
		lineX.isPickable = false;

		const lineZ = B.MeshBuilder.CreateBox(`seamZ_${i}`, { width: 0.04, height: 0.02, depth: ARENA_SIZE }, scene);
		lineZ.position.set(i, 0.01, 0);
		lineZ.material = seamMat;
		lineZ.isPickable = false;
	}

	// --- Perimeter Walls ---
	const wallPositions: [number, number, number, number][] = [
		[0, -half, ARENA_SIZE + 1, 1], // north
		[0, half, ARENA_SIZE + 1, 1], // south
		[-half, 0, 1, ARENA_SIZE + 1], // west
		[half, 0, 1, ARENA_SIZE + 1] // east
	];

	wallPositions.forEach(([x, z, w, d], i) => {
		const wall = B.MeshBuilder.CreateBox(`wall_${i}`, { width: w, height: WALL_HEIGHT, depth: d }, scene);
		wall.position.set(x, WALL_HEIGHT / 2, z);
		wall.material = wallMat;
		wall.checkCollisions = true;

		// Amber trim on top
		const trim = B.MeshBuilder.CreateBox(`wallTrim_${i}`, { width: w, height: 0.1, depth: d + 0.1 }, scene);
		trim.position.set(x, WALL_HEIGHT, z);
		trim.material = amberGlow;
		trim.isPickable = false;

		// Engraved horizontal lines at 1/3 and 2/3 height
		const thirdH = WALL_HEIGHT / 3;
		for (let li = 1; li <= 2; li++) {
			const lineY = thirdH * li;
			const engrave = B.MeshBuilder.CreateBox(`wallEngrave_${i}_${li}`, { width: w + 0.02, height: 0.06, depth: d + 0.12 }, scene);
			engrave.position.set(x, lineY, z);
			engrave.material = amberGlow;
			engrave.isPickable = false;
		}
	});

	// --- Corner Platforms with Stepped Base & Ramps ---
	const corners: [number, number][] = [
		[-half + 4, -half + 4],
		[half - 4, -half + 4],
		[-half + 4, half - 4],
		[half - 4, half - 4]
	];

	corners.forEach(([cx, cz], i) => {
		// Stepped base
		const baseStep = B.MeshBuilder.CreateBox(`platBase_${i}`, { width: 7.5, height: PLATFORM_HEIGHT * 0.3, depth: 7.5 }, scene);
		baseStep.position.set(cx, (PLATFORM_HEIGHT * 0.3) / 2, cz);
		baseStep.material = wallMat;
		baseStep.checkCollisions = true;

		// Platform top
		const plat = B.MeshBuilder.CreateBox(`platform_${i}`, { width: 6, height: PLATFORM_HEIGHT, depth: 6 }, scene);
		plat.position.set(cx, PLATFORM_HEIGHT / 2, cz);
		plat.material = platformMat;
		plat.checkCollisions = true;

		// Platform edge glow — amber
		const edgeTrim = B.MeshBuilder.CreateBox(`platTrim_${i}`, { width: 6.2, height: 0.08, depth: 6.2 }, scene);
		edgeTrim.position.set(cx, PLATFORM_HEIGHT, cz);
		edgeTrim.material = amberGlow;
		edgeTrim.isPickable = false;

		// Ramp facing center
		const rampDir = new B.Vector3(-Math.sign(cx), 0, -Math.sign(cz)).normalize();
		const ramp = B.MeshBuilder.CreateBox(`ramp_${i}`, { width: 2.5, height: 0.15, depth: 4 }, scene);
		const rampX = cx + rampDir.x * 4;
		const rampZ = cz + rampDir.z * 4;
		ramp.position.set(rampX, PLATFORM_HEIGHT / 2, rampZ);
		const angleDiag = Math.atan2(PLATFORM_HEIGHT, 4);
		if (Math.abs(rampDir.x) > Math.abs(rampDir.z)) {
			ramp.rotation.z = rampDir.x > 0 ? angleDiag : -angleDiag;
		} else {
			ramp.rotation.x = rampDir.z > 0 ? -angleDiag : angleDiag;
		}
		ramp.material = platformMat;
		ramp.checkCollisions = true;
	});

	// --- Cover Blocks with Amber Accent Lines ---
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

		// Amber accent strip on top
		const strip = B.MeshBuilder.CreateBox(`coverStrip_${i}`, { width: 2.6, height: 0.06, depth: 0.15 }, scene);
		strip.position.set(x, COVER_HEIGHT, z);
		strip.material = amberGlow;
		strip.isPickable = false;

		// Amber accent line on front face
		const frontLine = B.MeshBuilder.CreateBox(`coverFront_${i}`, { width: 2.4, height: 0.04, depth: 0.02 }, scene);
		frontLine.position.set(x, COVER_HEIGHT * 0.5, z + 1.26);
		frontLine.material = amberGlow;
		frontLine.isPickable = false;

		// Amber accent line on back face
		const backLine = B.MeshBuilder.CreateBox(`coverBack_${i}`, { width: 2.4, height: 0.04, depth: 0.02 }, scene);
		backLine.position.set(x, COVER_HEIGHT * 0.5, z - 1.26);
		backLine.material = amberGlow;
		backLine.isPickable = false;
	});

	// --- Center Platform with Forerunner Pillar ---
	const centerPlat = B.MeshBuilder.CreateBox('centerPlatform', { width: 5, height: 0.6, depth: 5 }, scene);
	centerPlat.position.set(0, 0.3, 0);
	centerPlat.material = platformMat;
	centerPlat.checkCollisions = true;

	const centerPlatTrim = B.MeshBuilder.CreateBox('centerPlatTrim', { width: 5.2, height: 0.06, depth: 5.2 }, scene);
	centerPlatTrim.position.set(0, 0.6, 0);
	centerPlatTrim.material = amberGlow;
	centerPlatTrim.isPickable = false;

	// Center pillar — silver material
	const pillar = B.MeshBuilder.CreateCylinder('pillar', { height: 4, diameter: 1, tessellation: 8 }, scene);
	pillar.position.set(0, 2.6, 0);
	pillar.material = silverMat;
	pillar.checkCollisions = true;

	// Amber ring at top
	const pillarRing = B.MeshBuilder.CreateTorus('pillarRing', { diameter: 1.5, thickness: 0.08, tessellation: 16 }, scene);
	pillarRing.position.set(0, 4.6, 0);
	pillarRing.material = amberGlow;
	pillarRing.isPickable = false;

	// 4 floating hard-light panels around pillar
	const panelOffsets: [number, number][] = [
		[2.2, 0],
		[-2.2, 0],
		[0, 2.2],
		[0, -2.2]
	];
	panelOffsets.forEach(([px, pz], i) => {
		const panel = B.MeshBuilder.CreateBox(`hardLight_${i}`, { width: 1.2, height: 2.0, depth: 0.06 }, scene);
		panel.position.set(px, 3.0, pz);
		// Rotate panels to face the pillar
		panel.lookAt(new B.Vector3(0, 3.0, 0));
		panel.material = hardLightMat;
		panel.isPickable = false;
	});

	// Triangle glyph on pillar (decorative Forerunner symbol)
	const glyphBar1 = B.MeshBuilder.CreateBox('glyph1', { width: 0.6, height: 0.04, depth: 0.04 }, scene);
	glyphBar1.position.set(0, 3.4, 0.52);
	glyphBar1.material = amberGlow;
	glyphBar1.isPickable = false;

	const glyphBar2 = B.MeshBuilder.CreateBox('glyph2', { width: 0.35, height: 0.04, depth: 0.04 }, scene);
	glyphBar2.position.set(-0.15, 3.65, 0.52);
	glyphBar2.rotation.z = Math.PI / 3;
	glyphBar2.material = amberGlow;
	glyphBar2.isPickable = false;

	const glyphBar3 = B.MeshBuilder.CreateBox('glyph3', { width: 0.35, height: 0.04, depth: 0.04 }, scene);
	glyphBar3.position.set(0.15, 3.65, 0.52);
	glyphBar3.rotation.z = -Math.PI / 3;
	glyphBar3.material = amberGlow;
	glyphBar3.isPickable = false;

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
