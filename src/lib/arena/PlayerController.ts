import type { BabylonNamespace } from './types';
import {
	PLAYER_SPEED,
	MOUSE_SENSITIVITY,
	GRAVITY,
	COLLISION_ELLIPSOID,
	PLAYER_HEIGHT,
	NEAR_CLIP,
	VERTICAL_LOOK_LIMIT
} from './constants';

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

	// Collisions
	camera.checkCollisions = true;
	camera.applyGravity = true;
	camera.ellipsoid = new B.Vector3(COLLISION_ELLIPSOID.x, COLLISION_ELLIPSOID.y, COLLISION_ELLIPSOID.z);
	camera.ellipsoidOffset = new B.Vector3(0, COLLISION_ELLIPSOID.y, 0);

	// Gravity
	scene.gravity = new B.Vector3(0, GRAVITY, 0);
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
		camera.detachControl();
		camera.dispose();
	}

	return { camera, getForwardRay, getPosition, dispose };
}
