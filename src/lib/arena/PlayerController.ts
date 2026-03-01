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

// With the ellipsoid (offset 1.0, height 1.0), the collision body extends
// from camera.y to camera.y+2.0. Eye level should be near the top of the
// body. GROUND_Y is the camera Y when standing on the floor (Y=0).
const GROUND_Y = 1.3;

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

	// WASD keys
	camera.keysUp = [87]; // W
	camera.keysDown = [83]; // S
	camera.keysLeft = [65]; // A
	camera.keysRight = [68]; // D
	camera.speed = PLAYER_SPEED;
	camera.angularSensibility = MOUSE_SENSITIVITY;

	// Collisions (horizontal only — we handle vertical ourselves)
	camera.checkCollisions = true;
	camera.applyGravity = false;
	camera.ellipsoid = new B.Vector3(COLLISION_ELLIPSOID.x, COLLISION_ELLIPSOID.y, COLLISION_ELLIPSOID.z);
	camera.ellipsoidOffset = new B.Vector3(0, COLLISION_ELLIPSOID.y, 0);

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

	// --- Jump: direct position control ---
	let yVel = 0;
	let grounded = true;
	let jumpRequested = false;

	// Only trigger jump on key DOWN, not while held
	const jumpObserver = scene.onKeyboardObservable.add((kbInfo) => {
		if (kbInfo.type === B.KeyboardEventTypes.KEYDOWN && kbInfo.event.code === 'Space') {
			if (grounded) {
				jumpRequested = true;
			}
		}
	});

	// Max camera Y: ceiling minus ellipsoid top (ellipsoid extends 1.0 above offset center)
	const maxCamY = CEILING_HEIGHT - COLLISION_ELLIPSOID.y * 2 - 0.05;

	const jumpFn = () => {
		if (jumpRequested && grounded) {
			yVel = JUMP_VELOCITY;
			grounded = false;
			jumpRequested = false;
		}

		if (!grounded) {
			// Apply gravity acceleration
			yVel += GRAVITY_ACCEL;

			// Move camera vertically
			camera.position.y += yVel;

			// Ceiling clamp
			if (camera.position.y > maxCamY) {
				camera.position.y = maxCamY;
				yVel = 0;
			}

			// Ground clamp
			if (camera.position.y <= GROUND_Y) {
				camera.position.y = GROUND_Y;
				yVel = 0;
				grounded = true;
			}
		} else {
			// Keep player pinned to ground (replaces applyGravity)
			camera.position.y = GROUND_Y;
		}
	};
	scene.registerBeforeRender(jumpFn);

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
		scene.unregisterBeforeRender(jumpFn);
		if (jumpObserver) scene.onKeyboardObservable.remove(jumpObserver);
		camera.detachControl();
		camera.dispose();
	}

	return { camera, getForwardRay, getPosition, dispose };
}
