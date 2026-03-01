import type { BabylonNamespace } from './types';
import {
	PLAYER_SPEED,
	MOUSE_SENSITIVITY,
	GRAVITY_ACCEL,
	COLLISION_ELLIPSOID,
	NEAR_CLIP,
	VERTICAL_LOOK_LIMIT,
	JUMP_VELOCITY,
	CEILING_HEIGHT
} from './constants';

// With the ellipsoid (offset -0.45, height 1.0), the collision body extends
// from Y=0 (feet) to Y=2.0 (head). GROUND_Y is camera Y when on the floor.
const GROUND_Y = 1.45;

// Fraction of ground speed available for mid-air directional nudges
const AIR_CONTROL = 0.10;

export interface PlayerController {
	camera: InstanceType<BabylonNamespace['FreeCamera']>;
	getForwardRay: () => InstanceType<BabylonNamespace['Ray']>;
	getPosition: () => InstanceType<BabylonNamespace['Vector3']>;
	dispose: () => void;
}

export function createPlayerController(
	B: BabylonNamespace,
	scene: InstanceType<BabylonNamespace['Scene']>,
	canvas: HTMLCanvasElement,
	spawnPos: { x: number; y: number; z: number }
): PlayerController {
	const camera = new B.FreeCamera('playerCam', new B.Vector3(spawnPos.x, spawnPos.y, spawnPos.z), scene);
	camera.setTarget(new B.Vector3(spawnPos.x, spawnPos.y, spawnPos.z + 1));
	camera.minZ = NEAR_CLIP;

	// Disable built-in WASD — we handle horizontal movement manually so it
	// stays purely on the XZ plane and doesn't interfere with jump physics.
	camera.keysUp = [];
	camera.keysDown = [];
	camera.keysLeft = [];
	camera.keysRight = [];
	camera.angularSensibility = MOUSE_SENSITIVITY;

	// Collisions — ellipsoid covers feet (Y=0) to head (Y=2.0)
	camera.checkCollisions = true;
	camera.applyGravity = false;
	camera.ellipsoid = new B.Vector3(COLLISION_ELLIPSOID.x, COLLISION_ELLIPSOID.y, COLLISION_ELLIPSOID.z);
	camera.ellipsoidOffset = new B.Vector3(0, -(GROUND_Y - COLLISION_ELLIPSOID.y), 0);

	scene.collisionsEnabled = true;

	camera.attachControl(canvas, true);

	// Pointer lock
	const requestLock = () => {
		canvas.requestPointerLock();
	};
	canvas.addEventListener('click', requestLock);

	// Clamp vertical look
	const clampFn = () => {
		if (camera.rotation.x > VERTICAL_LOOK_LIMIT) {
			camera.rotation.x = VERTICAL_LOOK_LIMIT;
		} else if (camera.rotation.x < -VERTICAL_LOOK_LIMIT) {
			camera.rotation.x = -VERTICAL_LOOK_LIMIT;
		}
	};
	scene.registerBeforeRender(clampFn);

	// --- Input state ---
	const keysHeld = new Set<string>();
	let yVel = 0;
	let grounded = true;
	let jumpRequested = false;
	let targetY = spawnPos.y;

	// Momentum: normalized direction at time of jump
	let airDirX = 0;
	let airDirZ = 0;

	const kbObserver = scene.onKeyboardObservable.add((kbInfo) => {
		const code = kbInfo.event.code;
		if (kbInfo.type === B.KeyboardEventTypes.KEYDOWN) {
			keysHeld.add(code);
			if (code === 'Space' && grounded) jumpRequested = true;
		} else if (kbInfo.type === B.KeyboardEventTypes.KEYUP) {
			keysHeld.delete(code);
		}
	});

	const maxCamY = CEILING_HEIGHT - COLLISION_ELLIPSOID.y * 2 - 0.05;
	const _moveVec = new B.Vector3();

	/** Returns normalized WASD direction on the XZ plane (from camera yaw). */
	function wasdDir(): [number, number] {
		const yRot = camera.rotation.y;
		const sinY = Math.sin(yRot);
		const cosY = Math.cos(yRot);
		let mx = 0, mz = 0;
		if (keysHeld.has('KeyW')) { mx += sinY; mz += cosY; }
		if (keysHeld.has('KeyS')) { mx -= sinY; mz -= cosY; }
		if (keysHeld.has('KeyA')) { mx -= cosY; mz += sinY; }
		if (keysHeld.has('KeyD')) { mx += cosY; mz -= sinY; }
		const len = Math.sqrt(mx * mx + mz * mz);
		if (len > 0.001) { mx /= len; mz /= len; }
		return [mx, mz];
	}

	const updateFn = () => {
		// Squash any residual cameraDirection so Babylon's _checkInputs is a no-op
		camera.cameraDirection.set(0, 0, 0);

		// Frame-rate-independent speed (matches Babylon's internal formula)
		const engine = scene.getEngine();
		const speed = PLAYER_SPEED * Math.sqrt(engine.getDeltaTime() / (engine.getFps() * 100));

		if (grounded) {
			// --- Ground movement: full WASD control ---
			const [dx, dz] = wasdDir();
			if (dx !== 0 || dz !== 0) {
				_moveVec.set(dx * speed, 0, dz * speed);
				(camera as any)._collideWithWorld(_moveVec);
			}
			// Continuously capture direction for potential jump launch
			airDirX = dx;
			airDirZ = dz;
		} else {
			// --- Air movement: momentum + slight nudge ---
			_moveVec.set(airDirX * speed, 0, airDirZ * speed);

			// Small air control for minor corrections
			const [dx, dz] = wasdDir();
			_moveVec.x += dx * speed * AIR_CONTROL;
			_moveVec.z += dz * speed * AIR_CONTROL;

			if (_moveVec.lengthSquared() > 0.00001) {
				(camera as any)._collideWithWorld(_moveVec);
			}
		}

		// --- Jump physics (vertical only) ---
		if (jumpRequested && grounded) {
			yVel = JUMP_VELOCITY;
			grounded = false;
			jumpRequested = false;
		}

		if (!grounded) {
			yVel += GRAVITY_ACCEL;
			targetY += yVel;

			if (targetY > maxCamY) {
				targetY = maxCamY;
				yVel = 0;
			}

			if (targetY <= GROUND_Y) {
				targetY = GROUND_Y;
				yVel = 0;
				grounded = true;
			}
		} else {
			targetY = GROUND_Y;
		}

		camera.position.y = targetY;
	};
	scene.registerBeforeRender(updateFn);

	const _forwardRay = new B.Ray(new B.Vector3(), new B.Vector3(), 100);
	function getForwardRay() {
		return camera.getForwardRayToRef(_forwardRay, 100);
	}

	function getPosition() {
		return camera.position;
	}

	function dispose() {
		canvas.removeEventListener('click', requestLock);
		scene.unregisterBeforeRender(clampFn);
		scene.unregisterBeforeRender(updateFn);
		if (kbObserver) scene.onKeyboardObservable.remove(kbObserver);
		camera.detachControl();
		camera.dispose();
	}

	return { camera, getForwardRay, getPosition, dispose };
}
