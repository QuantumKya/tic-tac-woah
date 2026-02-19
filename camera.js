class Camera {
    constructor(gl, fov, znear, zfar) {
        this.fieldOfView = fov;

        this.glWidth = gl.canvas.clientWidth;
        this.glHeight = gl.canvas.clientHeight;
        this.aspect = this.glWidth / this.glHeight;

        this.zNear = znear;
        this.zFar = zfar;
    }

    get projectionMatrix() {
        const projMatrix = mat4.create();
        mat4.perspective(projMatrix, this.fieldOfView, this.aspect, this.zNear, this.zFar);
        return projMatrix;
    }

    getRaycastFromMouse(mousePos) {
        // convert to NDC
        const xNDC = 2 * mousePos[0] / this.glWidth - 1;
        const yNDC = 1 - 2 * mousePos[1] / this.glHeight;

        const clipNear = vec4.fromValues(xNDC, yNDC, -1, 1);
        const clipFar = vec4.fromValues(xNDC, yNDC, 1, 1);

        // use inverse projection matrix for world space
        const inverseProjection = mat4.create();
        mat4.invert(inverseProjection, this.projectionMatrix);

        const pNear = vec4.create();
        const pFar = vec4.create();
        vec4.transformMat4(pNear, clipNear, inverseProjection);
        vec4.transformMat4(pFar, clipFar, inverseProjection);

        // get world space by division of w dimension
        vec3.scale(pNear, pNear, pNear[3]);
        vec3.scale(pFar, pFar, pFar[3]);

        // get final direction and normalize it
        const dir = vec3.create();
        vec3.subtract(dir, pFar, pNear);
        vec3.normalize(dir, dir);
        return dir;
    }
}

export default Camera;