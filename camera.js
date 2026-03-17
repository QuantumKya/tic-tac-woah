import { DIRECTIONS, getQuatFromEulerRad } from "./math_stuff.js";

class Camera {
    /**
     * @param {WebGLRenderingContext} gl
     * @param {number} fov angle of FOV in radians.
     * @param {number} znear the Z coordinate of the near face of clip space.
     * @param {number} zfar the Z coordinate of the far face of clip space.
     * @param {vec3} offsetPos the "position" of the camera in the scene.
     */
    constructor(gl, fov, znear, zfar, offsetPos = vec3.create()) {
        this.fieldOfView = fov;

        this.glWidth = gl.canvas.clientWidth;
        this.glHeight = gl.canvas.clientHeight;
        this.aspect = this.glWidth / this.glHeight;

        this.zNear = znear;
        this.zFar = zfar;

        this.position = offsetPos;
        this.rotationQuat = quat.create();
        this.matrixFn = (mat) => mat;
    }

    /** @returns {mat4} */
    get projectionMatrix() {
        const projMatrix = mat4.create();
        mat4.perspective(projMatrix, this.fieldOfView, this.aspect, this.zNear, this.zFar);
        return projMatrix;
    }

    /** @returns {mat4} */
    get viewMatrix() {
        const camMatrix = mat4.create();
        mat4.fromRotationTranslation(
            camMatrix,
            this.rotationQuat,
            this.position
        );

        const view = mat4.create();
        mat4.invert(view, camMatrix);

        this.matrixFn(view);

        return view;
    }

    /** @param {function(mat:mat4): void} fn */
    setMatrixFn(fn) {
        this.matrixFn = fn;
    }

    /**
     * @param {number} x X coordinate.
     * @param {number} y Y coordinate.
     * @param {number} z Z coordinate.
     */
    setPosition(x, y, z) { vec3.set(this.position, x, y, z); }
    
    /** @param {vec3} pos */
    setTargetPosition(pos) {
        const view = mat4.create();
        mat4.lookAt(view, this.position, pos, DIRECTIONS.Y);
        const world = mat4.create();
        mat4.invert(world, view);

        mat4.getRotation(this.rotationQuat, world);
    }

    /** @param {vec3} dir Direction for the camera to face. */
    setFacingDirection(dir) {
        const target = vec3.create();
        vec3.add(target, this.position, dir);
        this.setTargetPosition(target);
    }



    /**
     * @param {number} x X coordinate.
     * @param {number} y Y coordinate.
     * @param {number} z Z coordinate.
     */
    moveBy(x, y, z) {
        const moveVec = vec3.fromValues(x, y, z);
        vec3.add(this.position, this.position, moveVec);
    }
    
    /**
     * @param {number} rotX Angle about the X axis.
     * @param {number} rotY Angle about the Y axis.
     * @param {number} rotZ Angle about the Z axis.
     */
    setRotation(rotX, rotY, rotZ) {
        this.rotationQuat = getQuatFromEulerRad(rotX, rotY, rotZ);
    }

    /**
     * @param {number} rotX Angle to rotate the camera by about the X axis.
     * @param {number} rotY Angle to rotate the camera by about the Y axis.
     * @param {number} rotZ Angle to rotate the camera by about the Z axis.
     */
    rotateBy(rotX, rotY, rotZ) {
        const rotatorQuat = getQuatFromEulerRad(rotX, rotY, rotZ);
        quat.multiply(this.rotationQuat, this.rotationQuat, rotatorQuat);
    }

    /** @param {number} rot Angle about the X axis. */
    rotateX(rot) { quat.rotateX(this.rotationQuat, this.rotationQuat, rot); }
    /** @param {number} rot Angle about the Y axis. */
    rotateY(rot) { quat.rotateY(this.rotationQuat, this.rotationQuat, rot); }
    /** @param {number} rot Angle about the Z axis. */
    rotateZ(rot) { quat.rotateZ(this.rotationQuat, this.rotationQuat, rot); }

    /** @param {number} rot Angle to roll camera by. */
    roll(angle) { this.rotateZ(rot); }



    /**
     * @param {vec2} mousePos The mouse position on the canvas.
     * @returns {{ origin: vec3, dir: vec3 }} The direction of the raycast (the origin of the ray is the camera's position).
     */
    getRaycastFromMouse(mousePos) {
        // convert to NDC
        const xNDC = 2 * mousePos[0] / this.glWidth - 1;
        const yNDC = 1 - 2 * mousePos[1] / this.glHeight;

        const clipNear = vec4.fromValues(xNDC, yNDC, -1, 1);
        const clipFar = vec4.fromValues(xNDC, yNDC, 1, 1);

        // inverse matrices
        const inverseProjection = mat4.create();
        mat4.invert(inverseProjection, this.projectionMatrix);
        const inverseView = mat4.create();
        mat4.invert(inverseView, this.viewMatrix);

        // use projection inversion to get camera space
        const pNearCamera = vec4.create();
        const pFarCamera = vec4.create();
        vec4.transformMat4(pNearCamera, clipNear, inverseProjection);
        vec4.transformMat4(pFarCamera, clipFar, inverseProjection);

        // divide by w (idk I kinda looked it up)
        vec4.scale(pNearCamera, pNearCamera, 1/pNearCamera[3]);
        vec4.scale(pFarCamera, pFarCamera, 1/pFarCamera[3]);

        // go from camera space to world space
        const pNearWorld = vec4.create();
        const pFarWorld = vec4.create();
        vec4.transformMat4(pNearWorld, pNearCamera, inverseView);
        vec4.transformMat4(pFarWorld, pFarCamera, inverseView);

        
        const origin4 = vec4.create();
        vec4.transformMat4(origin4, vec4.fromValues(0,0,0,1), inverseView);
        
        // get 3D coordinates from vec4s
        const origin = vec3.fromValues(origin4[0], origin4[1], origin4[2]);
        const pNear = vec3.fromValues(pNearWorld[0], pNearWorld[1], pNearWorld[2]);
        const pFar = vec3.fromValues(pFarWorld[0], pFarWorld[1], pFarWorld[2]);

        // get final direction and normalize it!
        const dir = vec3.create();
        vec3.subtract(dir, pFar, pNear);
        vec3.normalize(dir, dir);
        return { origin, dir };
    }
}

export default Camera;