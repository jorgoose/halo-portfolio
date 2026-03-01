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
const GROUND_Y = 1.45;

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

	// Collisions — ellipsoid covers feet (Y=0) to head (Y=2.0)
	// Center at camera.y + offset = 1.45 + (-0.45) = 1.0, extends ±1.0
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

	let targetY = spawnPos.y;

	const jumpFn = () => {
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
	scene.registerBeforeRender(jumpFn);

	// Runs AFTER Babylon's _checkInputs applies cameraDirection to position.
	// WASD movement while looking up/down adds a Y component — we squash it
	// and force position.y back to our physics-calculated targetY.
	const postInputObserver = camera.onAfterCheckInputsObservable.add(() => {
		camera.cameraDirection.y = 0;
		camera.position.y = targetY;
	});

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
		if (postInputObserver) camera.onAfterCheckInputsObservable.remove(postInputObserver);
		camera.detachControl();
		camera.dispose();
	}

	return { camera, getForwardRay, getPosition, dispose };
}
