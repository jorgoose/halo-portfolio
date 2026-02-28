import type { BabylonNamespace, ArenaMapResult } from './types';
import {
	ARENA_SIZE,
	BASE_HEIGHT,
	COLOR_AMBER,
	COLOR_FORERUNNER_SILVER,
	COLOR_GROUND_GRASS,
	COLOR_ROCK,
	COLOR_CLIFF,
	COLOR_WATER,
	SKY_ZENITH,
	SKY_MID,
	SKY_HORIZON,
	SKY_BOTTOM
} from './constants';

export function createArenaMap(
	B: BabylonNamespace,
	scene: InstanceType<BabylonNamespace['Scene']>
): ArenaMapResult {
	const allMeshes: InstanceType<BabylonNamespace['Mesh']>[] = [];
	const allMaterials: InstanceType<BabylonNamespace['StandardMaterial']>[] = [];

	// --- 2A: Procedural Sky Dome ---
	const skyDome = B.MeshBuilder.CreateSphere('skyDome', { diameter: 500, segments: 16 }, scene);
	skyDome.scaling = new B.Vector3(-1, 1, 1);
	skyDome.infiniteDistance = true;
	skyDome.isPickable = false;

	const skyMat = new B.StandardMaterial('skyMat', scene);
	const skyTex = new B.DynamicTexture('skyTex', { width: 1, height: 256 }, scene, false);
	const ctx = skyTex.getContext();

	// Vertical gradient: zenith (top) → mid → horizon → bottom (fog blend)
	const grad = ctx.createLinearGradient(0, 0, 0, 256);
	grad.addColorStop(0.0, SKY_ZENITH);
	grad.addColorStop(0.3, SKY_MID);
	grad.addColorStop(0.6, SKY_HORIZON);
	grad.addColorStop(1.0, SKY_BOTTOM);
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, 1, 256);
	skyTex.update();

	skyMat.emissiveTexture = skyTex;
	skyMat.diffuseColor = new B.Color3(0, 0, 0);
	skyMat.specularColor = new B.Color3(0, 0, 0);
	skyMat.disableLighting = true;
	skyMat.backFaceCulling = false;
	skyDome.material = skyMat;
	allMeshes.push(skyDome as InstanceType<BabylonNamespace['Mesh']>);
	allMaterials.push(skyMat);

	// --- 2B: Materials ---
	const grassMat = new B.StandardMaterial('grassMat', scene);
	grassMat.diffuseColor = new B.Color3(...COLOR_GROUND_GRASS);
	grassMat.specularColor = new B.Color3(0.05, 0.05, 0.04);

	const rockMat = new B.StandardMaterial('rockMat', scene);
	rockMat.diffuseColor = new B.Color3(...COLOR_ROCK);
	rockMat.specularColor = new B.Color3(0.1, 0.1, 0.09);

	const cliffMat = new B.StandardMaterial('cliffMat', scene);
	cliffMat.diffuseColor = new B.Color3(...COLOR_CLIFF);
	cliffMat.specularColor = new B.Color3(0.08, 0.08, 0.07);

	const waterMat = new B.StandardMaterial('waterMat', scene);
	waterMat.diffuseColor = new B.Color3(...COLOR_WATER);
	waterMat.specularColor = new B.Color3(0.2, 0.2, 0.2);
	waterMat.alpha = 0.7;

	const silverMat = new B.StandardMaterial('silverMat', scene);
	silverMat.diffuseColor = new B.Color3(...COLOR_FORERUNNER_SILVER);
	silverMat.specularColor = new B.Color3(0.4, 0.4, 0.38);
	silverMat.emissiveColor = new B.Color3(0.06, 0.06, 0.058);

	const amberGlow = new B.StandardMaterial('amberGlow', scene);
	amberGlow.emissiveColor = new B.Color3(...COLOR_AMBER);
	amberGlow.diffuseColor = new B.Color3(0, 0, 0);
	amberGlow.alpha = 0.9;

	const platformMat = new B.StandardMaterial('platformMat', scene);
	platformMat.diffuseColor = new B.Color3(0.12, 0.12, 0.13);
	platformMat.specularColor = new B.Color3(0.15, 0.15, 0.14);
	platformMat.emissiveColor = new B.Color3(0.02, 0.02, 0.02);

	const hardLightMat = new B.StandardMaterial('hardLightMat', scene);
	hardLightMat.emissiveColor = new B.Color3(...COLOR_AMBER);
	hardLightMat.diffuseColor = new B.Color3(0, 0, 0);
	hardLightMat.alpha = 0.3;
	hardLightMat.backFaceCulling = false;

	allMaterials.push(grassMat, rockMat, cliffMat, waterMat, silverMat, amberGlow, platformMat, hardLightMat);

	// --- 2C: Valley Floor ---
	const floor = B.MeshBuilder.CreateGround('floor', { width: ARENA_SIZE, height: ARENA_SIZE }, scene);
	floor.material = grassMat;
	floor.checkCollisions = true;
	floor.receiveShadows = true;
	allMeshes.push(floor as InstanceType<BabylonNamespace['Mesh']>);

	// --- 2D: Two Elevated Bases (Z = ±70) ---
	const baseZPositions = [-70, 70];
	baseZPositions.forEach((bz, bi) => {
		// Main platform box
		const base = B.MeshBuilder.CreateBox(`base_${bi}`, { width: 20, height: BASE_HEIGHT, depth: 16 }, scene);
		base.position.set(0, BASE_HEIGHT / 2, bz);
		base.material = silverMat;
		base.checkCollisions = true;

		// Walkable top surface
		const top = B.MeshBuilder.CreateBox(`baseTop_${bi}`, { width: 20, height: 0.4, depth: 16 }, scene);
		top.position.set(0, BASE_HEIGHT + 0.2, bz);
		top.material = platformMat;
		top.checkCollisions = true;

		// Amber trim around top edge
		const trimFront = B.MeshBuilder.CreateBox(`baseTrimF_${bi}`, { width: 20.2, height: 0.15, depth: 0.15 }, scene);
		trimFront.position.set(0, BASE_HEIGHT + 0.4, bz + (bz < 0 ? 8 : -8));
		trimFront.material = amberGlow;
		trimFront.isPickable = false;

		const trimBack = B.MeshBuilder.CreateBox(`baseTrimB_${bi}`, { width: 20.2, height: 0.15, depth: 0.15 }, scene);
		trimBack.position.set(0, BASE_HEIGHT + 0.4, bz + (bz < 0 ? -8 : 8));
		trimBack.material = amberGlow;
		trimBack.isPickable = false;

		const trimLeft = B.MeshBuilder.CreateBox(`baseTrimL_${bi}`, { width: 0.15, height: 0.15, depth: 16.2 }, scene);
		trimLeft.position.set(-10, BASE_HEIGHT + 0.4, bz);
		trimLeft.material = amberGlow;
		trimLeft.isPickable = false;

		const trimRight = B.MeshBuilder.CreateBox(`baseTrimR_${bi}`, { width: 0.15, height: 0.15, depth: 16.2 }, scene);
		trimRight.position.set(10, BASE_HEIGHT + 0.4, bz);
		trimRight.material = amberGlow;
		trimRight.isPickable = false;

		// Front ramp facing valley center
		const frontRampDir = bz < 0 ? 1 : -1;
		const frontRamp = B.MeshBuilder.CreateBox(`frontRamp_${bi}`, { width: 5, height: 0.3, depth: 16 }, scene);
		frontRamp.position.set(0, BASE_HEIGHT / 2, bz + frontRampDir * 16);
		frontRamp.rotation.x = frontRampDir * -Math.atan2(BASE_HEIGHT, 16);
		frontRamp.material = platformMat;
		frontRamp.checkCollisions = true;

		// Side ramps
		const sideXPositions = [-8, 8];
		sideXPositions.forEach((sx, si) => {
			const sideRamp = B.MeshBuilder.CreateBox(`sideRamp_${bi}_${si}`, { width: 3, height: 0.3, depth: 10 }, scene);
			sideRamp.position.set(sx, BASE_HEIGHT / 2, bz + frontRampDir * 13);
			sideRamp.rotation.x = frontRampDir * -Math.atan2(BASE_HEIGHT, 10);
			sideRamp.material = platformMat;
			sideRamp.checkCollisions = true;
			allMeshes.push(sideRamp as InstanceType<BabylonNamespace['Mesh']>);
		});

		allMeshes.push(
			base as InstanceType<BabylonNamespace['Mesh']>,
			top as InstanceType<BabylonNamespace['Mesh']>,
			trimFront as InstanceType<BabylonNamespace['Mesh']>,
			trimBack as InstanceType<BabylonNamespace['Mesh']>,
			trimLeft as InstanceType<BabylonNamespace['Mesh']>,
			trimRight as InstanceType<BabylonNamespace['Mesh']>,
			frontRamp as InstanceType<BabylonNamespace['Mesh']>
		);
	});

	// --- 2E: Central Forerunner Monument ---
	const centerPlat = B.MeshBuilder.CreateCylinder('centerPlat', { height: 1, diameter: 14, tessellation: 8 }, scene);
	centerPlat.position.set(0, 0.5, 0);
	centerPlat.material = platformMat;
	centerPlat.checkCollisions = true;

	const obelisk = B.MeshBuilder.CreateBox('obelisk', { width: 2, height: 10, depth: 2 }, scene);
	obelisk.position.set(0, 6, 0);
	obelisk.material = silverMat;
	obelisk.checkCollisions = true;

	const topRing = B.MeshBuilder.CreateTorus('topRing', { diameter: 3.5, thickness: 0.15, tessellation: 16 }, scene);
	topRing.position.set(0, 11.5, 0);
	topRing.material = amberGlow;
	topRing.isPickable = false;

	allMeshes.push(
		centerPlat as InstanceType<BabylonNamespace['Mesh']>,
		obelisk as InstanceType<BabylonNamespace['Mesh']>,
		topRing as InstanceType<BabylonNamespace['Mesh']>
	);

	// 4 hard-light panels facing inward
	const panelOffsets: [number, number][] = [
		[4.5, 0],
		[-4.5, 0],
		[0, 4.5],
		[0, -4.5]
	];
	panelOffsets.forEach(([px, pz], i) => {
		const panel = B.MeshBuilder.CreateBox(`hardLight_${i}`, { width: 1.8, height: 3, depth: 0.06 }, scene);
		panel.position.set(px, 6, pz);
		panel.lookAt(new B.Vector3(0, 6, 0));
		panel.material = hardLightMat;
		panel.isPickable = false;
		allMeshes.push(panel as InstanceType<BabylonNamespace['Mesh']>);
	});

	// --- 2F: Rock Formations (~16 clusters) ---
	const rockDefs: { x: number; z: number; w: number; h: number; d: number; ry: number }[] = [
		// Valley flanks (X ≈ ±35) — large rock groups
		{ x: -35, z: -30, w: 6, h: 5, d: 5, ry: 0.3 },
		{ x: -38, z: -25, w: 4, h: 3.5, d: 4, ry: -0.5 },
		{ x: -34, z: 10, w: 5, h: 4.5, d: 6, ry: 0.8 },
		{ x: -37, z: 15, w: 3.5, h: 3, d: 4, ry: -0.2 },
		{ x: 35, z: -10, w: 5, h: 4, d: 5, ry: -0.4 },
		{ x: 38, z: -5, w: 4, h: 3.5, d: 3.5, ry: 0.6 },
		{ x: 34, z: 30, w: 6, h: 5, d: 5, ry: -0.7 },
		{ x: 37, z: 25, w: 3.5, h: 3, d: 4, ry: 0.1 },
		// Mid-field — medium rocks between bases and center
		{ x: -15, z: -40, w: 4, h: 3, d: 4, ry: 0.5 },
		{ x: 15, z: -35, w: 3.5, h: 2.5, d: 3.5, ry: -0.3 },
		{ x: -15, z: 40, w: 4, h: 3, d: 4, ry: -0.6 },
		{ x: 15, z: 35, w: 3.5, h: 2.5, d: 3.5, ry: 0.4 },
		// Near center — low rocks for close-quarters cover
		{ x: -8, z: -12, w: 3, h: 2, d: 3, ry: 0.2 },
		{ x: 8, z: 12, w: 3, h: 2, d: 3, ry: -0.8 },
		{ x: -10, z: 8, w: 3.5, h: 2.5, d: 3, ry: 0.9 },
		{ x: 10, z: -8, w: 3, h: 2, d: 3.5, ry: -0.1 }
	];

	rockDefs.forEach((r, i) => {
		const rock = B.MeshBuilder.CreateBox(`rock_${i}`, { width: r.w, height: r.h, depth: r.d }, scene);
		rock.position.set(r.x, r.h / 2, r.z);
		rock.rotation.y = r.ry;
		rock.material = rockMat;
		rock.checkCollisions = true;
		allMeshes.push(rock as InstanceType<BabylonNamespace['Mesh']>);
	});

	// --- 2G: Cliff Boundaries ---
	const half = ARENA_SIZE / 2;
	const cliffHeight = 30;

	// East/West cliff walls (visual only — collision handled by boundary walls below)
	for (let i = 0; i < 6; i++) {
		const zPos = -half + 20 + i * (ARENA_SIZE - 40) / 5;

		const eastCliff = B.MeshBuilder.CreateBox(`cliffE_${i}`, { width: 4, height: cliffHeight, depth: 35 }, scene);
		eastCliff.position.set(half - 2, cliffHeight / 2, zPos);
		eastCliff.material = cliffMat;
		eastCliff.checkCollisions = false;
		eastCliff.isPickable = false;
		allMeshes.push(eastCliff as InstanceType<BabylonNamespace['Mesh']>);

		const westCliff = B.MeshBuilder.CreateBox(`cliffW_${i}`, { width: 4, height: cliffHeight, depth: 35 }, scene);
		westCliff.position.set(-half + 2, cliffHeight / 2, zPos);
		westCliff.material = cliffMat;
		westCliff.checkCollisions = false;
		westCliff.isPickable = false;
		allMeshes.push(westCliff as InstanceType<BabylonNamespace['Mesh']>);
	}

	// North/South cliff walls (visual only)
	for (let i = 0; i < 6; i++) {
		const xPos = -half + 20 + i * (ARENA_SIZE - 40) / 5;

		const northCliff = B.MeshBuilder.CreateBox(`cliffN_${i}`, { width: 35, height: cliffHeight, depth: 4 }, scene);
		northCliff.position.set(xPos, cliffHeight / 2, -half + 2);
		northCliff.material = cliffMat;
		northCliff.checkCollisions = false;
		northCliff.isPickable = false;
		allMeshes.push(northCliff as InstanceType<BabylonNamespace['Mesh']>);

		const southCliff = B.MeshBuilder.CreateBox(`cliffS_${i}`, { width: 35, height: cliffHeight, depth: 4 }, scene);
		southCliff.position.set(xPos, cliffHeight / 2, half - 2);
		southCliff.material = cliffMat;
		southCliff.checkCollisions = false;
		southCliff.isPickable = false;
		allMeshes.push(southCliff as InstanceType<BabylonNamespace['Mesh']>);
	}

	// 4 invisible boundary walls replace 24 cliff collision meshes
	const wallThickness = 2;
	const wallHeight = cliffHeight;

	const eastWall = B.MeshBuilder.CreateBox('boundaryE', { width: wallThickness, height: wallHeight, depth: ARENA_SIZE }, scene);
	eastWall.position.set(half - 1, wallHeight / 2, 0);
	eastWall.checkCollisions = true;
	eastWall.isVisible = false;
	eastWall.isPickable = false;

	const westWall = B.MeshBuilder.CreateBox('boundaryW', { width: wallThickness, height: wallHeight, depth: ARENA_SIZE }, scene);
	westWall.position.set(-half + 1, wallHeight / 2, 0);
	westWall.checkCollisions = true;
	westWall.isVisible = false;
	westWall.isPickable = false;

	const northWall = B.MeshBuilder.CreateBox('boundaryN', { width: ARENA_SIZE, height: wallHeight, depth: wallThickness }, scene);
	northWall.position.set(0, wallHeight / 2, -half + 1);
	northWall.checkCollisions = true;
	northWall.isVisible = false;
	northWall.isPickable = false;

	const southWall = B.MeshBuilder.CreateBox('boundaryS', { width: ARENA_SIZE, height: wallHeight, depth: wallThickness }, scene);
	southWall.position.set(0, wallHeight / 2, half - 1);
	southWall.checkCollisions = true;
	southWall.isVisible = false;
	southWall.isPickable = false;

	// --- 2H: Decorative Stream ---
	const stream = B.MeshBuilder.CreateGround('stream', { width: 3, height: 120 }, scene);
	stream.position.set(8, 0.02, 0);
	stream.material = waterMat;
	stream.isPickable = false;

	allMeshes.push(
		eastWall as InstanceType<BabylonNamespace['Mesh']>,
		westWall as InstanceType<BabylonNamespace['Mesh']>,
		northWall as InstanceType<BabylonNamespace['Mesh']>,
		southWall as InstanceType<BabylonNamespace['Mesh']>,
		stream as InstanceType<BabylonNamespace['Mesh']>
	);

	// --- 2I: Spawn Points ---
	const spawnPoints = {
		player: [
			{ x: 0, y: BASE_HEIGHT + 2.4, z: -70 },
			{ x: 0, y: BASE_HEIGHT + 2.4, z: 70 }
		],
		enemy: [
			{ x: -20, y: 0.5, z: -30 },
			{ x: 20, y: 0.5, z: -30 },
			{ x: -20, y: 0.5, z: 30 },
			{ x: 20, y: 0.5, z: 30 },
			{ x: 0, y: 0.5, z: -15 },
			{ x: 0, y: 0.5, z: 15 }
		],
		nav: [
			{ x: -30, y: 0.5, z: -50 },
			{ x: 30, y: 0.5, z: -50 },
			{ x: 30, y: 0.5, z: -20 },
			{ x: 30, y: 0.5, z: 20 },
			{ x: 30, y: 0.5, z: 50 },
			{ x: -30, y: 0.5, z: 50 },
			{ x: -30, y: 0.5, z: 20 },
			{ x: -30, y: 0.5, z: -20 },
			{ x: 0, y: 0.5, z: -40 },
			{ x: 15, y: 0.5, z: 0 },
			{ x: 0, y: 0.5, z: 40 },
			{ x: -15, y: 0.5, z: 0 }
		]
	};

	// --- Freeze all static meshes and materials ---
	// Tells Babylon to cache world matrices (skips recalc every frame) and
	// freeze materials (skips shader-dirty checks). Huge win for ~80+ meshes.
	for (const mesh of allMeshes) {
		mesh.freezeWorldMatrix();
	}
	for (const mat of allMaterials) {
		mat.freeze();
	}

	return { spawnPoints };
}
