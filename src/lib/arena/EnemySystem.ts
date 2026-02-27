import type { BabylonNamespace, EnemyData, SpawnPoints } from './types';
import { EnemyState } from './types';
import type { VFXManager } from './VFXManager';
import {
	ENEMY_HEALTH,
	ENEMY_DAMAGE,
	ENEMY_FIRE_RATE,
	ENEMY_SPEED,
	ENEMY_DETECT_RANGE,
	ENEMY_ATTACK_RANGE,
	MAX_ENEMIES,
	ENEMY_RESPAWN_TIME,
	COLOR_ENEMY_RED,
	COLOR_DARK_METAL,
	WEAPON_DAMAGE
} from './constants';

export interface EnemySystem {
	enemies: EnemyData[];
	update: (dt: number, playerPos: InstanceType<BabylonNamespace['Vector3']>) => number;
	damageEnemy: (mesh: InstanceType<BabylonNamespace['AbstractMesh']>, amount: number) => boolean;
	reset: () => void;
	dispose: () => void;
}

export function createEnemySystem(
	B: BabylonNamespace,
	scene: InstanceType<BabylonNamespace['Scene']>,
	spawnPoints: SpawnPoints,
	vfx: VFXManager
): EnemySystem {
	const enemies: EnemyData[] = [];

	// --- Materials ---
	const bodyMat = new B.StandardMaterial('enemyBodyMat', scene);
	bodyMat.diffuseColor = new B.Color3(...COLOR_DARK_METAL);
	bodyMat.emissiveColor = new B.Color3(0.05, 0.05, 0.08);

	const visorMat = new B.StandardMaterial('enemyVisorMat', scene);
	visorMat.emissiveColor = new B.Color3(...COLOR_ENEMY_RED);
	visorMat.diffuseColor = new B.Color3(0, 0, 0);

	function buildEnemyMesh(index: number): { mesh: InstanceType<BabylonNamespace['Mesh']>; headMesh: InstanceType<BabylonNamespace['Mesh']> } {
		// Body (box)
		const body = B.MeshBuilder.CreateBox(`enemyBody_${index}`, { width: 0.6, height: 1.2, depth: 0.4 }, scene);
		body.material = bodyMat;

		// Head (sphere)
		const head = B.MeshBuilder.CreateSphere(`enemyHead_${index}`, { diameter: 0.5, segments: 6 }, scene);
		head.position.y = 0.85;
		head.material = bodyMat;
		head.parent = body;

		// Visor (flattened sphere on face)
		const visor = B.MeshBuilder.CreateSphere(`enemyVisor_${index}`, { diameter: 0.35, segments: 4 }, scene);
		visor.scaling = new B.Vector3(1, 0.5, 0.3);
		visor.position.set(0, 0.85, 0.2);
		visor.material = visorMat;
		visor.parent = body;

		// Arms (cylinders)
		const leftArm = B.MeshBuilder.CreateCylinder(`enemyLArm_${index}`, { height: 0.8, diameter: 0.18, tessellation: 6 }, scene);
		leftArm.position.set(-0.45, 0.1, 0);
		leftArm.material = bodyMat;
		leftArm.parent = body;

		const rightArm = B.MeshBuilder.CreateCylinder(`enemyRArm_${index}`, { height: 0.8, diameter: 0.18, tessellation: 6 }, scene);
		rightArm.position.set(0.45, 0.1, 0);
		rightArm.material = bodyMat;
		rightArm.parent = body;

		// Legs (cylinders)
		const leftLeg = B.MeshBuilder.CreateCylinder(`enemyLLeg_${index}`, { height: 0.7, diameter: 0.2, tessellation: 6 }, scene);
		leftLeg.position.set(-0.15, -0.95, 0);
		leftLeg.material = bodyMat;
		leftLeg.parent = body;

		const rightLeg = B.MeshBuilder.CreateCylinder(`enemyRLeg_${index}`, { height: 0.7, diameter: 0.2, tessellation: 6 }, scene);
		rightLeg.position.set(0.15, -0.95, 0);
		rightLeg.material = bodyMat;
		rightLeg.parent = body;

		// Make body and head shootable
		body.metadata = { shootable: true, enemy: true, enemyIndex: index };
		head.metadata = { shootable: true, enemy: true, enemyIndex: index };
		visor.metadata = { shootable: true, enemy: true, enemyIndex: index };

		// Collision for enemy raycasts to be blocked by
		body.checkCollisions = false;
		body.isPickable = true;
		head.isPickable = true;
		visor.isPickable = true;

		return { mesh: body as InstanceType<BabylonNamespace['Mesh']>, headMesh: head as InstanceType<BabylonNamespace['Mesh']> };
	}

	function spawnEnemy(index: number) {
		const sp = spawnPoints.enemy[index % spawnPoints.enemy.length];
		const { mesh, headMesh } = buildEnemyMesh(index);
		mesh.position.set(sp.x, sp.y, sp.z);

		const enemy: EnemyData = {
			mesh,
			headMesh,
			health: ENEMY_HEALTH,
			state: EnemyState.PATROL,
			stateTimer: 0,
			attackCooldown: ENEMY_FIRE_RATE,
			currentNavIndex: Math.floor(Math.random() * spawnPoints.nav.length),
			respawnTimer: 0,
			spawnIndex: index
		};

		enemies.push(enemy);
	}

	// Initial spawn
	for (let i = 0; i < MAX_ENEMIES; i++) {
		spawnEnemy(i);
	}

	function update(dt: number, playerPos: InstanceType<BabylonNamespace['Vector3']>): number {
		let playerDamage = 0;

		for (const enemy of enemies) {
			if (enemy.state === EnemyState.DEAD) {
				enemy.respawnTimer -= dt;
				if (enemy.respawnTimer <= 0) {
					respawnEnemy(enemy);
				}
				continue;
			}

			const enemyPos = enemy.mesh.position;
			const toPlayer = playerPos.subtract(enemyPos);
			const distToPlayer = toPlayer.length();

			enemy.stateTimer += dt;
			enemy.attackCooldown -= dt;

			switch (enemy.state) {
				case EnemyState.IDLE:
					if (distToPlayer < ENEMY_DETECT_RANGE) {
						enemy.state = EnemyState.CHASE;
						enemy.stateTimer = 0;
					} else if (enemy.stateTimer > 2) {
						enemy.state = EnemyState.PATROL;
						enemy.stateTimer = 0;
					}
					break;

				case EnemyState.PATROL: {
					const navTarget = spawnPoints.nav[enemy.currentNavIndex];
					const navPos = new B.Vector3(navTarget.x, navTarget.y, navTarget.z);
					const toNav = navPos.subtract(enemyPos);

					if (toNav.length() < 1.5) {
						enemy.currentNavIndex = (enemy.currentNavIndex + 1) % spawnPoints.nav.length;
					} else {
						const moveDir = toNav.normalize().scale(ENEMY_SPEED);
						enemy.mesh.position.addInPlace(moveDir);
						// Face movement direction
						enemy.mesh.lookAt(enemyPos.add(toNav));
					}

					if (distToPlayer < ENEMY_DETECT_RANGE) {
						enemy.state = EnemyState.CHASE;
						enemy.stateTimer = 0;
					}
					break;
				}

				case EnemyState.CHASE: {
					if (distToPlayer > ENEMY_DETECT_RANGE * 1.3) {
						enemy.state = EnemyState.PATROL;
						enemy.stateTimer = 0;
						break;
					}

					if (distToPlayer < ENEMY_ATTACK_RANGE) {
						enemy.state = EnemyState.ATTACK;
						enemy.stateTimer = 0;
						break;
					}

					const moveDir = toPlayer.normalize().scale(ENEMY_SPEED);
					enemy.mesh.position.addInPlace(moveDir);
					enemy.mesh.lookAt(new B.Vector3(playerPos.x, enemyPos.y, playerPos.z));
					break;
				}

				case EnemyState.ATTACK: {
					if (distToPlayer > ENEMY_ATTACK_RANGE * 1.2) {
						enemy.state = EnemyState.CHASE;
						enemy.stateTimer = 0;
						break;
					}

					// Face player
					enemy.mesh.lookAt(new B.Vector3(playerPos.x, enemyPos.y, playerPos.z));

					// Shoot at player
					if (enemy.attackCooldown <= 0) {
						enemy.attackCooldown = ENEMY_FIRE_RATE;

						// Raycast from enemy to player to check for cover
						const shootOrigin = enemyPos.add(new B.Vector3(0, 0.8, 0));
						const shootDir = playerPos.subtract(shootOrigin).normalize();
						const ray = new B.Ray(shootOrigin, shootDir, ENEMY_ATTACK_RANGE + 5);

						const pick = scene.pickWithRay(ray, (mesh) => {
							return mesh.isPickable && !mesh.metadata?.enemy && mesh.name !== 'floor';
						});

						// If the first thing hit is close to the player, it's a hit
						if (pick?.hit && pick.pickedPoint) {
							const hitDist = pick.pickedPoint.subtract(playerPos).length();
							if (hitDist < 2) {
								playerDamage += ENEMY_DAMAGE;
							}
						}
					}
					break;
				}
			}
		}

		return playerDamage;
	}

	function damageEnemy(mesh: InstanceType<BabylonNamespace['AbstractMesh']>, amount: number): boolean {
		const index = mesh.metadata?.enemyIndex;
		if (index === undefined) return false;

		const enemy = enemies.find((e) => e.spawnIndex === index);
		if (!enemy || enemy.state === EnemyState.DEAD) return false;

		enemy.health -= amount;
		vfx.damageFlash(enemy.mesh);

		if (enemy.health <= 0) {
			killEnemy(enemy);
			return true;
		}

		// Aggro on damage
		if (enemy.state === EnemyState.IDLE || enemy.state === EnemyState.PATROL) {
			enemy.state = EnemyState.CHASE;
			enemy.stateTimer = 0;
		}

		return false;
	}

	function killEnemy(enemy: EnemyData) {
		vfx.deathEffect(enemy.mesh.position.clone());
		enemy.state = EnemyState.DEAD;
		enemy.respawnTimer = ENEMY_RESPAWN_TIME;
		enemy.mesh.setEnabled(false);
	}

	function respawnEnemy(enemy: EnemyData) {
		const sp = spawnPoints.enemy[enemy.spawnIndex % spawnPoints.enemy.length];
		enemy.mesh.position.set(sp.x, sp.y, sp.z);
		enemy.mesh.setEnabled(true);
		enemy.health = ENEMY_HEALTH;
		enemy.state = EnemyState.PATROL;
		enemy.stateTimer = 0;
		enemy.attackCooldown = ENEMY_FIRE_RATE;
		enemy.currentNavIndex = Math.floor(Math.random() * spawnPoints.nav.length);
	}

	function reset() {
		enemies.forEach((enemy, i) => {
			const sp = spawnPoints.enemy[i % spawnPoints.enemy.length];
			enemy.mesh.position.set(sp.x, sp.y, sp.z);
			enemy.mesh.setEnabled(true);
			enemy.health = ENEMY_HEALTH;
			enemy.state = EnemyState.PATROL;
			enemy.stateTimer = 0;
			enemy.attackCooldown = ENEMY_FIRE_RATE;
			enemy.respawnTimer = 0;
		});
	}

	function dispose() {
		enemies.forEach((enemy) => {
			enemy.mesh.dispose(false, true);
		});
		enemies.length = 0;
		bodyMat.dispose();
		visorMat.dispose();
	}

	return {
		enemies,
		update,
		damageEnemy,
		reset,
		dispose
	};
}
