class Camera {
    /**
     * 
     * @param {*} gl 
     * @param {number} fov angle of FOV in radians
     * @param {number} znear 
     * @param {number} zfar 
     * @param {vec3} offsetPos 
     */
    constructor(gl, fov, znear, zfar, offsetPos = vec3.fromValues(0,0,0)) {
        this.fieldOfView = fov;

        this.glWidth = gl.canvas.clientWidth;
        this.glHeight = gl.canvas.clientHeight;
        this.aspect = this.glWidth / this.glHeight;

        this.zNear = znear;
        this.zFar = zfar;

        this.position = offsetPos;
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
        const view = mat4.create();
        
        const flippos = vec3.create();
        vec3.negate(flippos, this.position);
        mat4.translate(view, view, [flippos[0], flippos[1], flippos[2]]);

        this.matrixFn(view);

        return view;
    }

    /** @param {function(mat:mat4): void} fn */
    setMatrixFn(fn) {
        this.matrixFn = fn;
    }

    /**
     * @param {vec2} mousePos The mouse position on the canvas.
     * @returns {vec3} The direction of the raycast (the origin of the ray is the camera's position).
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

        // divide by w
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

        // get final direction and normalize it
        const dir = vec3.create();
        vec3.subtract(dir, pFar, pNear);
        vec3.normalize(dir, dir);
        return { origin, dir };
    }
}

export default Camera;