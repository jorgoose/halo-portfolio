import type { BabylonNamespace, ArenaMapResult } from './types';
import {
	ARENA_WIDTH,
	ARENA_SIZE,
	CEILING_HEIGHT,
	WALL_THICKNESS,
	DOOR_WIDTH,
	DOOR_HEIGHT,
	COLOR_WALL,
	COLOR_FLOOR,
	COLOR_CEILING,
	COLOR_PILLAR,
	COLOR_DOORFRAME,
	COLOR_AMBER,
	COLOR_CRATE,
	COLOR_BARRICADE,
	COLOR_CEILING_LIGHT,
	COLOR_DARK_METAL
} from './constants';

export function createArenaMap(
	B: BabylonNamespace,
	scene: InstanceType<BabylonNamespace['Scene']>
): ArenaMapResult {
	const allMeshes: InstanceType<BabylonNamespace['Mesh']>[] = [];
	const allMaterials: InstanceType<BabylonNamespace['StandardMaterial']>[] = [];

	// Groups for mesh merging (visual-only, same-material)
	const doorframeMeshes: InstanceType<BabylonNamespace['Mesh']>[] = [];
	const accentMeshes: InstanceType<BabylonNamespace['Mesh']>[] = [];
	const ceilingLightMeshes: InstanceType<BabylonNamespace['Mesh']>[] = [];
	const ribMeshes: InstanceType<BabylonNamespace['Mesh']>[] = [];

	const halfW = ARENA_WIDTH / 2;  // 40
	const halfL = ARENA_SIZE / 2;   // 60
	const H = CEILING_HEIGHT;       // 6
	const T = WALL_THICKNESS;       // 0.5

	// --- Materials ---
	const wallMat = new B.StandardMaterial('wallMat', scene);
	wallMat.diffuseColor = new B.Color3(...COLOR_WALL);
	wallMat.specularColor = new B.Color3(0.15, 0.15, 0.14);

	const floorMat = new B.StandardMaterial('floorMat', scene);
	floorMat.diffuseColor = new B.Color3(...COLOR_FLOOR);
	floorMat.specularColor = new B.Color3(0.08, 0.08, 0.08);

	const ceilingMat = new B.StandardMaterial('ceilingMat', scene);
	ceilingMat.diffuseColor = new B.Color3(...COLOR_CEILING);
	ceilingMat.specularColor = new B.Color3(0.1, 0.1, 0.1);

	const pillarMat = new B.StandardMaterial('pillarMat', scene);
	pillarMat.diffuseColor = new B.Color3(...COLOR_PILLAR);
	pillarMat.specularColor = new B.Color3(0.12, 0.12, 0.12);

	const doorframeMat = new B.StandardMaterial('doorframeMat', scene);
	doorframeMat.diffuseColor = new B.Color3(...COLOR_DOORFRAME);
	doorframeMat.specularColor = new B.Color3(0.1, 0.1, 0.1);

	const accentStripMat = new B.StandardMaterial('accentStripMat', scene);
	accentStripMat.emissiveColor = new B.Color3(...COLOR_AMBER);
	accentStripMat.diffuseColor = new B.Color3(0, 0, 0);
	accentStripMat.disableLighting = true;

	const crateMat = new B.StandardMaterial('crateMat', scene);
	crateMat.diffuseColor = new B.Color3(...COLOR_CRATE);
	crateMat.specularColor = new B.Color3(0.08, 0.08, 0.07);

	const barricadeMat = new B.StandardMaterial('barricadeMat', scene);
	barricadeMat.diffuseColor = new B.Color3(...COLOR_BARRICADE);
	barricadeMat.specularColor = new B.Color3(0.12, 0.12, 0.12);

	const ceilingLightMat = new B.StandardMaterial('ceilingLightMat', scene);
	ceilingLightMat.emissiveColor = new B.Color3(...COLOR_CEILING_LIGHT);
	ceilingLightMat.diffuseColor = new B.Color3(0, 0, 0);
	ceilingLightMat.disableLighting = true;

	const basePlatMat = new B.StandardMaterial('basePlatMat', scene);
	basePlatMat.diffuseColor = new B.Color3(...COLOR_DARK_METAL);
	basePlatMat.specularColor = new B.Color3(0.1, 0.1, 0.1);

	allMaterials.push(wallMat, floorMat, ceilingMat, pillarMat, doorframeMat, accentStripMat, crateMat, barricadeMat, ceilingLightMat, basePlatMat);

	// --- Helper: wall segment ---
	let wallIdx = 0;
	function addWall(x: number, z: number, w: number, d: number) {
		const wall = B.MeshBuilder.CreateBox(`wall_${wallIdx++}`, { width: w, height: H, depth: d }, scene);
		wall.position.set(x, H / 2, z);
		wall.material = wallMat;
		wall.checkCollisions = true;
		wall.isPickable = true;
		allMeshes.push(wall as InstanceType<BabylonNamespace['Mesh']>);
		return wall;
	}

	// --- Helper: doorframe (visual trim around a doorway) ---
	let doorIdx = 0;
	function addDoorframe(x: number, z: number, facingX: boolean) {
		const dw = DOOR_WIDTH;
		const dh = DOOR_HEIGHT;
		const frameW = 0.3;
		const frameT = T + 0.06; // slightly wider than wall to prevent z-fighting
		const id = doorIdx++;

		// Left jamb
		const left = B.MeshBuilder.CreateBox(`df_l_${id}`, {
			width: facingX ? frameT : frameW,
			height: H,
			depth: facingX ? frameW : frameT
		}, scene);
		left.position.set(
			x + (facingX ? 0 : -dw / 2 - frameW / 2),
			H / 2,
			z + (facingX ? -dw / 2 - frameW / 2 : 0)
		);
		left.material = doorframeMat;
		left.isPickable = false;
		doorframeMeshes.push(left as InstanceType<BabylonNamespace['Mesh']>);

		// Right jamb
		const right = B.MeshBuilder.CreateBox(`df_r_${id}`, {
			width: facingX ? frameT : frameW,
			height: H,
			depth: facingX ? frameW : frameT
		}, scene);
		right.position.set(
			x + (facingX ? 0 : dw / 2 + frameW / 2),
			H / 2,
			z + (facingX ? dw / 2 + frameW / 2 : 0)
		);
		right.material = doorframeMat;
		right.isPickable = false;
		doorframeMeshes.push(right as InstanceType<BabylonNamespace['Mesh']>);

		// Lintel (top bar above door)
		const lintel = B.MeshBuilder.CreateBox(`df_t_${id}`, {
			width: facingX ? frameT : dw + frameW * 2,
			height: H - dh,
			depth: facingX ? dw + frameW * 2 : frameT
		}, scene);
		lintel.position.set(x, dh + (H - dh) / 2, z);
		lintel.material = doorframeMat;
		lintel.isPickable = false;
		doorframeMeshes.push(lintel as InstanceType<BabylonNamespace['Mesh']>);
	}

	// ============================================================
	// 1. FLOOR
	// ============================================================
	const floor = B.MeshBuilder.CreateGround('floor', { width: ARENA_WIDTH, height: ARENA_SIZE }, scene);
	floor.material = floorMat;
	floor.checkCollisions = true;
	floor.isPickable = true;
	allMeshes.push(floor as InstanceType<BabylonNamespace['Mesh']>);

	// ============================================================
	// 2. CEILING
	// ============================================================
	const ceiling = B.MeshBuilder.CreateGround('ceiling', { width: ARENA_WIDTH, height: ARENA_SIZE }, scene);
	ceiling.position.y = H;
	ceiling.rotation.x = Math.PI;
	ceiling.material = ceilingMat;
	ceiling.checkCollisions = true;
	ceiling.isPickable = false;
	allMeshes.push(ceiling as InstanceType<BabylonNamespace['Mesh']>);

	// ============================================================
	// 3. PERIMETER WALLS
	// ============================================================
	// East wall (X = +40)
	addWall(halfW, 0, T, ARENA_SIZE);
	// West wall (X = -40)
	addWall(-halfW, 0, T, ARENA_SIZE);
	// North wall (Z = +60)
	addWall(0, halfL, ARENA_WIDTH, T);
	// South wall (Z = -60)
	addWall(0, -halfL, ARENA_WIDTH, T);

	// ============================================================
	// 4. INTERIOR WALLS — Room definitions
	// ============================================================
	// Layout key dimensions:
	// Base rooms: Z=-60 to -44 and Z=+44 to +60 (16 deep, 20 wide centered)
	// Corridors: Z=-44 to -10 and Z=+10 to +44
	//   Main corridor: X=-4 to X=+4 (8 wide)
	//   West flank: X=-40 to X=-34 inner wall, corridor X=-25 to -19 (6 wide)
	//   East flank: X=+19 to +25 (6 wide)
	// Side rooms: Armory/Barracks at Z~-34 to -22, Storage/MedBay at Z~+22 to +34
	// Central hub: Z=-10 to +10, X=-15 to +15

	// --- BASE SOUTH (Z=-60 to -44) ---
	// East wall of south base
	addWall(10, -52, T, 16);
	// West wall of south base
	addWall(-10, -52, T, 16);
	// North wall of south base — with center doorway (4 wide)
	// Left segment: X=-10 to -2
	addWall(-6, -44, 8, T);
	// Right segment: X=+2 to +10
	addWall(6, -44, 8, T);
	// Doorframe at south base exit
	addDoorframe(0, -44, false);

	// --- BASE NORTH (Z=+44 to +60) ---
	addWall(10, 52, T, 16);
	addWall(-10, 52, T, 16);
	// South wall of north base — with center doorway
	addWall(-6, 44, 8, T);
	addWall(6, 44, 8, T);
	addDoorframe(0, 44, false);

	// --- SOUTH CORRIDOR SECTION (Z=-44 to -10) ---
	// Main corridor east wall (X=+4, Z=-44 to -10, with gaps for side rooms)
	// Segment: Z=-44 to -34
	addWall(4, -39, T, 10);
	// Gap at Z=-34 (doorway into barracks)
	addDoorframe(4, -34, true);
	// Segment: Z=-34 to -22 (barracks doorway already at -34)
	addWall(4, -28, T, 12);
	// Gap at Z=-22 (doorway back from barracks)
	// Actually let's simplify: one doorway per side room
	// Segment: Z=-22 to -10
	addWall(4, -16, T, 12);

	// Main corridor west wall (X=-4, Z=-44 to -10)
	addWall(-4, -39, T, 10);
	addDoorframe(-4, -34, true);
	addWall(-4, -28, T, 12);
	addWall(-4, -16, T, 12);

	// West flank outer wall (already perimeter at X=-40)
	// West flank inner wall (X=-19, Z=-44 to -10, with doorway gaps into armory)
	addWall(-19, -39, T, 10);
	addDoorframe(-19, -34, true);
	addWall(-19, -28, T, 12);
	addWall(-19, -16, T, 12);

	// East flank inner wall (X=+19, Z=-44 to -10)
	addWall(19, -39, T, 10);
	addDoorframe(19, -34, true);
	addWall(19, -28, T, 12);
	addWall(19, -16, T, 12);

	// Armory room (west side room, X=-19 to -4, Z=-34 to -22)
	// North wall of armory
	addWall(-11.5, -22, 15, T);
	// South wall of armory
	addWall(-11.5, -34, 15, T);

	// Barracks room (east side room, X=+4 to +19, Z=-34 to -22)
	addWall(11.5, -22, 15, T);
	addWall(11.5, -34, 15, T);

	// Flank corridor walls (connect bases to hub through side paths)
	// West flank: X=-40 to -19
	// Cross walls at Z=-44 (south entry to west flank)
	// Leave gap for doorway at X=-29.5 (center of flank)
	addWall(-24, -44, 10, T); // X=-19 to -29
	addDoorframe(-29.5, -44, false);
	addWall(-35, -44, 10, T); // X=-30 to -40

	// East flank at Z=-44
	addWall(24, -44, 10, T);
	addDoorframe(29.5, -44, false);
	addWall(35, -44, 10, T);

	// --- NORTH CORRIDOR SECTION (Z=+10 to +44) — mirror of south ---
	// Main corridor east wall
	addWall(4, 39, T, 10);
	addDoorframe(4, 34, true);
	addWall(4, 28, T, 12);
	addWall(4, 16, T, 12);

	// Main corridor west wall
	addWall(-4, 39, T, 10);
	addDoorframe(-4, 34, true);
	addWall(-4, 28, T, 12);
	addWall(-4, 16, T, 12);

	// West flank inner wall
	addWall(-19, 39, T, 10);
	addDoorframe(-19, 34, true);
	addWall(-19, 28, T, 12);
	addWall(-19, 16, T, 12);

	// East flank inner wall
	addWall(19, 39, T, 10);
	addDoorframe(19, 34, true);
	addWall(19, 28, T, 12);
	addWall(19, 16, T, 12);

	// Storage room (west, Z=+22 to +34)
	addWall(-11.5, 22, 15, T);
	addWall(-11.5, 34, 15, T);

	// Med Bay room (east, Z=+22 to +34)
	addWall(11.5, 22, 15, T);
	addWall(11.5, 34, 15, T);

	// Flank cross walls at Z=+44
	addWall(-24, 44, 10, T);
	addDoorframe(-29.5, 44, false);
	addWall(-35, 44, 10, T);

	addWall(24, 44, 10, T);
	addDoorframe(29.5, 44, false);
	addWall(35, 44, 10, T);

	// --- CENTRAL HUB (Z=-10 to +10) ---
	// Hub east wall (X=+15) with doorway at Z=0
	addWall(15, -5, T, 10);
	addWall(15, 5, T, 10);
	addDoorframe(15, 0, true);

	// Hub west wall (X=-15)
	addWall(-15, -5, T, 10);
	addWall(-15, 5, T, 10);
	addDoorframe(-15, 0, true);

	// Hub north wall (Z=+10) — doorways at main corridor (X=0) and flanks
	// Main corridor doorway
	addWall(-9.5, 10, 11, T); // X=-15 to -4
	addWall(9.5, 10, 11, T);  // X=+4 to +15
	addDoorframe(0, 10, false);

	// Hub south wall (Z=-10)
	addWall(-9.5, -10, 11, T);
	addWall(9.5, -10, 11, T);
	addDoorframe(0, -10, false);

	// Flank-to-hub connections: walls from X=-40/-19 to X=-15 at Z=-10/+10
	// West side Z=-10 wall
	addWall(-17, -10, 4, T); // X=-15 to -19
	// West outer flank wall at Z=-10 (X=-19 to -40, with doorway)
	addWall(-25, -10, 12, T);
	addDoorframe(-31, -10, false);
	addWall(-37, -10, 6, T);

	// West side Z=+10 wall
	addWall(-17, 10, 4, T);
	addWall(-25, 10, 12, T);
	addDoorframe(-31, 10, false);
	addWall(-37, 10, 6, T);

	// East side Z=-10
	addWall(17, -10, 4, T);
	addWall(25, -10, 12, T);
	addDoorframe(31, -10, false);
	addWall(37, -10, 6, T);

	// East side Z=+10
	addWall(17, 10, 4, T);
	addWall(25, 10, 12, T);
	addDoorframe(31, 10, false);
	addWall(37, 10, 6, T);

	// ============================================================
	// 5a. HUB DIVIDER WALL (breaks north-south line of sight)
	// ============================================================
	// East-west wall at Z=0, leaving gaps past the pillars for flanking
	addWall(0, 0, 10, T);

	// ============================================================
	// 5. HUB PILLARS (4 structural columns)
	// ============================================================
	const pillarPositions: [number, number][] = [[-10, -6], [10, -6], [-10, 6], [10, 6]];
	pillarPositions.forEach(([px, pz], i) => {
		const pillar = B.MeshBuilder.CreateBox(`pillar_${i}`, { width: 1, height: H, depth: 1 }, scene);
		pillar.position.set(px, H / 2, pz);
		pillar.material = pillarMat;
		pillar.checkCollisions = true;
		pillar.isPickable = true;
		allMeshes.push(pillar as InstanceType<BabylonNamespace['Mesh']>);
	});

	// ============================================================
	// 6. COVER: CRATES
	// ============================================================
	const crateDefs: { x: number; z: number; w: number; h: number; d: number; ry?: number }[] = [
		// Central hub — scattered
		{ x: -6, z: -7, w: 1.6, h: 1.2, d: 1.4, ry: 0.15 },
		{ x: -4.5, z: -6.2, w: 1, h: 0.8, d: 0.9, ry: -0.4 },  // nearby small crate
		{ x: 8, z: 2, w: 1.4, h: 1.1, d: 1.3, ry: -0.25 },
		{ x: -3, z: 5, w: 1, h: 0.7, d: 1.1, ry: 0.55 },
		{ x: 3.5, z: -4, w: 1.8, h: 1.3, d: 1.5, ry: 0.1 },    // bottom of stacked pair
		{ x: 3.5, z: -4, w: 1.1, h: 0.8, d: 1.0, ry: 0.35 },   // top of stacked pair (y set below)
		{ x: -11, z: 1.5, w: 1.2, h: 0.9, d: 1.2, ry: -0.6 },  // near west pillar
		{ x: 6, z: 7, w: 1.3, h: 1.0, d: 1.4, ry: 0.7 },
		// Corridor intersections
		{ x: 0, z: -16, w: 1.2, h: 1, d: 1.2 },
		{ x: 0, z: 16, w: 1.2, h: 1, d: 1.2 },
		// Side rooms
		{ x: -12, z: -28, w: 2, h: 1.4, d: 1.5 },  // Armory
		{ x: 12, z: -28, w: 1.5, h: 1, d: 2 },      // Barracks
		{ x: -12, z: 28, w: 1.5, h: 1, d: 1.5 },    // Storage
		{ x: 12, z: 28, w: 2, h: 1.4, d: 1.5 }      // Med Bay
	];
	const stackBottomH = 1.3; // height of stacked pair bottom crate (index 4)
	crateDefs.forEach((c, i) => {
		const crate = B.MeshBuilder.CreateBox(`crate_${i}`, { width: c.w, height: c.h, depth: c.d }, scene);
		const y = i === 5 ? stackBottomH + c.h / 2 : c.h / 2; // stack top crate on bottom
		crate.position.set(c.x, y, c.z);
		if (c.ry) crate.rotation.y = c.ry;
		crate.material = crateMat;
		crate.checkCollisions = true;
		crate.isPickable = true;
		allMeshes.push(crate as InstanceType<BabylonNamespace['Mesh']>);
	});

	// ============================================================
	// 7. COVER: BARRICADES (waist-high metal shields)
	// ============================================================
	const barricadeDefs: { x: number; z: number; w: number; d: number; ry?: number }[] = [
		{ x: -8, z: -3, w: 2.5, d: 0.3, ry: 0.2 },   // Hub west-south
		{ x: 5, z: 6, w: 2.2, d: 0.3, ry: -0.35 },   // Hub east-north
		{ x: 0, z: -27, w: 2, d: 0.3 },           // South main corridor
		{ x: 0, z: 27, w: 2, d: 0.3 },            // North main corridor
		{ x: -29.5, z: -27, w: 2, d: 0.3, ry: 0.4 }, // West flank
		{ x: 29.5, z: 27, w: 2, d: 0.3, ry: -0.4 }   // East flank
	];
	barricadeDefs.forEach((b, i) => {
		const barricade = B.MeshBuilder.CreateBox(`barricade_${i}`, { width: b.w, height: 1.2, depth: b.d }, scene);
		barricade.position.set(b.x, 0.6, b.z);
		if (b.ry) barricade.rotation.y = b.ry;
		barricade.material = barricadeMat;
		barricade.checkCollisions = true;
		barricade.isPickable = true;
		allMeshes.push(barricade as InstanceType<BabylonNamespace['Mesh']>);
	});

	// ============================================================
	// 8. ACCENT STRIPS (emissive amber along walls at Y=4.5)
	// ============================================================
	let accentIdx = 0;

	// Perimeter accent strips
	// East wall
	for (let z = -55; z <= 55; z += 10) {
		const strip = B.MeshBuilder.CreateBox(`accent_${accentIdx++}`, { width: 0.05, height: 0.1, depth: 8 }, scene);
		strip.position.set(halfW - T / 2 - 0.03, 4.5, z);
		strip.material = accentStripMat;
		strip.isPickable = false;
		accentMeshes.push(strip as InstanceType<BabylonNamespace['Mesh']>);
	}
	// West wall
	for (let z = -55; z <= 55; z += 10) {
		const strip = B.MeshBuilder.CreateBox(`accent_${accentIdx++}`, { width: 0.05, height: 0.1, depth: 8 }, scene);
		strip.position.set(-halfW + T / 2 + 0.03, 4.5, z);
		strip.material = accentStripMat;
		strip.isPickable = false;
		accentMeshes.push(strip as InstanceType<BabylonNamespace['Mesh']>);
	}
	// Main corridor walls
	for (let z = -40; z <= 40; z += 10) {
		// East side (X=4)
		const se = B.MeshBuilder.CreateBox(`accent_${accentIdx++}`, { width: 0.05, height: 0.1, depth: 8 }, scene);
		se.position.set(4 + T / 2 + 0.03, 4.5, z);
		se.material = accentStripMat;
		se.isPickable = false;
		accentMeshes.push(se as InstanceType<BabylonNamespace['Mesh']>);
		// West side (X=-4)
		const sw = B.MeshBuilder.CreateBox(`accent_${accentIdx++}`, { width: 0.05, height: 0.1, depth: 8 }, scene);
		sw.position.set(-4 - T / 2 - 0.03, 4.5, z);
		sw.material = accentStripMat;
		sw.isPickable = false;
		accentMeshes.push(sw as InstanceType<BabylonNamespace['Mesh']>);
	}
	// Hub walls
	for (let x = -12; x <= 12; x += 8) {
		// North (Z=10)
		const sn = B.MeshBuilder.CreateBox(`accent_${accentIdx++}`, { width: 6, height: 0.1, depth: 0.05 }, scene);
		sn.position.set(x, 4.5, 10 - T / 2 - 0.03);
		sn.material = accentStripMat;
		sn.isPickable = false;
		accentMeshes.push(sn as InstanceType<BabylonNamespace['Mesh']>);
		// South (Z=-10)
		const ss = B.MeshBuilder.CreateBox(`accent_${accentIdx++}`, { width: 6, height: 0.1, depth: 0.05 }, scene);
		ss.position.set(x, 4.5, -10 + T / 2 + 0.03);
		ss.material = accentStripMat;
		ss.isPickable = false;
		accentMeshes.push(ss as InstanceType<BabylonNamespace['Mesh']>);
	}

	// ============================================================
	// 9. CEILING LIGHT PANELS
	// ============================================================
	let lightIdx = 0;
	const lightPositions: [number, number][] = [
		// Main corridor
		[0, -40], [0, -30], [0, -20], [0, 20], [0, 30], [0, 40],
		// Hub
		[-8, -4], [0, -4], [8, -4], [-8, 4], [0, 4], [8, 4],
		// West flank
		[-29.5, -35], [-29.5, -20], [-29.5, 0], [-29.5, 20], [-29.5, 35],
		// East flank
		[29.5, -35], [29.5, -20], [29.5, 0], [29.5, 20], [29.5, 35],
		// Bases
		[0, -52], [0, 52]
	];
	lightPositions.forEach(([lx, lz]) => {
		const light = B.MeshBuilder.CreateBox(`cLight_${lightIdx++}`, { width: 2, height: 0.08, depth: 1 }, scene);
		light.position.set(lx, H - 0.05, lz);
		light.material = ceilingLightMat;
		light.isPickable = false;
		ceilingLightMeshes.push(light as InstanceType<BabylonNamespace['Mesh']>);
	});

	// ============================================================
	// 10. STRUCTURAL RIBS (thin vertical strips on walls)
	// ============================================================
	let ribIdx = 0;
	// Perimeter ribs
	for (let z = -52; z <= 52; z += 8) {
		// East
		const re = B.MeshBuilder.CreateBox(`rib_${ribIdx++}`, { width: 0.08, height: H, depth: 0.4 }, scene);
		re.position.set(halfW - T / 2 - 0.04, H / 2, z);
		re.material = pillarMat;
		re.isPickable = false;
		ribMeshes.push(re as InstanceType<BabylonNamespace['Mesh']>);
		// West
		const rw = B.MeshBuilder.CreateBox(`rib_${ribIdx++}`, { width: 0.08, height: H, depth: 0.4 }, scene);
		rw.position.set(-halfW + T / 2 + 0.04, H / 2, z);
		rw.material = pillarMat;
		rw.isPickable = false;
		ribMeshes.push(rw as InstanceType<BabylonNamespace['Mesh']>);
	}
	// North/south wall ribs
	for (let x = -32; x <= 32; x += 8) {
		const rn = B.MeshBuilder.CreateBox(`rib_${ribIdx++}`, { width: 0.4, height: H, depth: 0.08 }, scene);
		rn.position.set(x, H / 2, halfL - T / 2 - 0.04);
		rn.material = pillarMat;
		rn.isPickable = false;
		ribMeshes.push(rn as InstanceType<BabylonNamespace['Mesh']>);

		const rs = B.MeshBuilder.CreateBox(`rib_${ribIdx++}`, { width: 0.4, height: H, depth: 0.08 }, scene);
		rs.position.set(x, H / 2, -halfL + T / 2 + 0.04);
		rs.material = pillarMat;
		rs.isPickable = false;
		ribMeshes.push(rs as InstanceType<BabylonNamespace['Mesh']>);
	}

	// ============================================================
	// 11. SPAWN POINTS
	// ============================================================
	const spawnPoints = {
		player: [
			{ x: 0, y: 0, z: -52 },
			{ x: 0, y: 0, z: 52 }
		],
		enemy: [
			{ x: -29.5, y: 0.5, z: -27 }, // West flank south
			{ x: 29.5, y: 0.5, z: -27 },  // East flank south
			{ x: -29.5, y: 0.5, z: 27 },  // West flank north
			{ x: 29.5, y: 0.5, z: 27 },   // East flank north
			{ x: 0, y: 0.5, z: -5 },      // Hub south
			{ x: 0, y: 0.5, z: 5 }        // Hub north
		],
		nav: [
			// Main corridor loop
			{ x: 0, y: 0.5, z: -40 },
			{ x: 0, y: 0.5, z: -20 },
			{ x: 0, y: 0.5, z: 0 },
			{ x: 0, y: 0.5, z: 20 },
			{ x: 0, y: 0.5, z: 40 },
			// West flank
			{ x: -29.5, y: 0.5, z: -35 },
			{ x: -29.5, y: 0.5, z: 0 },
			{ x: -29.5, y: 0.5, z: 35 },
			// East flank
			{ x: 29.5, y: 0.5, z: -35 },
			{ x: 29.5, y: 0.5, z: 0 },
			{ x: 29.5, y: 0.5, z: 35 },
			// Hub cross
			{ x: -10, y: 0.5, z: 0 }
		]
	};

	// ============================================================
	// MERGE visual-only mesh groups
	// ============================================================
	function mergeGroup(
		meshes: InstanceType<BabylonNamespace['Mesh']>[],
		name: string
	): InstanceType<BabylonNamespace['Mesh']> | null {
		if (meshes.length === 0) return null;
		for (const m of meshes) m.bakeCurrentTransformIntoVertices();
		const merged = B.Mesh.MergeMeshes(meshes, true) as InstanceType<BabylonNamespace['Mesh']> | null;
		if (merged) {
			merged.name = name;
			merged.isPickable = false;
			merged.checkCollisions = false;
			allMeshes.push(merged);
		}
		return merged;
	}

	mergeGroup(doorframeMeshes, 'mergedDoorframes');
	mergeGroup(accentMeshes, 'mergedAccents');
	mergeGroup(ceilingLightMeshes, 'mergedCeilingLights');
	mergeGroup(ribMeshes, 'mergedRibs');

	// ============================================================
	// FREEZE all static meshes and materials
	// ============================================================
	for (const mesh of allMeshes) {
		mesh.freezeWorldMatrix();
	}
	for (const mat of allMaterials) {
		mat.freeze();
	}

	return { spawnPoints };
}
