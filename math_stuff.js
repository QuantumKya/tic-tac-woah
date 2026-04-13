const avgArray = (arr) => {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => a + b, 0);
    return sum / arr.length;
}
const wAvgArray = (arr, weights) => {
    if (arr.length !== weights.length) return 0;
    if (arr.length === 0 || weights.length === 0) return 0;

    let arrSum = 0;
    let weightSum = 0;

    for (let i = 0; i < arr.length; i++) {
        arrSum += arr[i] * weights[i];
        weightSum += weights[i];
    }

    if (weightSum === 0) return 0;
    return arrSum / weightSum;
}

/**
 * @param {vec3} point 
 * @param {vec3} norm 
 * @param {vec3} anchor 
 * @returns {number}
 */
function distanceToPlane(point, norm, anchor) {
    const nNorm = vec3.create();
    vec3.normalize(nNorm, norm);

    const pa = vec3.create();
    vec3.subtract(pa, point, anchor);
    return vec3.dot(pa, nNorm);
}

/**
 * Find the average of a set of vectors.
 * @param  {...vec3} pts The points to average the coordinates of.
 */
const avgPoints = (...pts) => {
    return vec3.fromValues(
        avgArray(pts.map(p=>p[0])),
        avgArray(pts.map(p=>p[1])),
        avgArray(pts.map(p=>p[2])),
    );
}

const X = vec3.fromValues(1,0,0);
const Y = vec3.fromValues(0,1,0);
const Z = vec3.fromValues(0,0,1);
const MX = vec3.fromValues(-1,0,0);
const MY = vec3.fromValues(0,-1,0);
const MZ = vec3.fromValues(0,0,-1);
const XY = vec3.fromValues(1,1,0);
const YZ = vec3.fromValues(0,1,1);
const XZ = vec3.fromValues(1,0,1);
const XYZ = vec3.fromValues(1,1,1);
const DIRECTIONS = {
    X, Y, Z,
    MX, MY, MZ,
    XY, YZ, XZ,
    XYZ,
};



/** @param {...number} xs @returns {Array<number>} */
const unNoise = (...xs) => {
    return xs.map(x => {
        if (Math.abs(x) <= 1e-5) return 0;
        return x;
    });
}

/** @param {mat4} mat Rotation matrix. @returns {vec3} */
const getEulerAnglesFromMatrix = (mat) => {
    let x, y, z;

    y = Math.asin(-mat[2]);

    if (Math.abs(mat[2]) < 1 - 1e-6) {
        x = Math.atan2(mat[6], mat[10]);
        z = Math.atan2(mat[1], mat[0]);
    }
    else { // gimbal lock
        x = Math.atan2(-mat[9], mat[5]);
        z = 0;
    }

    return vec3.fromValues(x, y, z);
}

const getQuatFromEulerRad = (rotX, rotY, rotZ) => {
    const rotQuat = quat.create();
    quat.fromEuler(rotQuat,
        rotX * 180/Math.PI,
        rotY * 180/Math.PI,
        rotZ * 180/Math.PI,
        'yxz'
    );
    return rotQuat;
};

/**
 * Project a 3D point onto a given plane.
 * @param {vec3} pnt Point to project.
 * @param {Plane} plane Plane to project onto.
 * @returns {vec3} Projected point.
 */
function projectPointOnPlane(pnt, plane) {
    const planeToPoint = vec3.create();
    vec3.subtract(planeToPoint, pnt, plane.anchor);
    const dist = vec3.dot(planeToPoint, plane.normal);
    const proj = vec3.create();
    vec3.scale(proj, plane.normal, dist);

    const projectum = vec3.create();
    vec3.subtract(projectum, pnt, proj);
    return projectum;
}

/**
 * Get a vector's equivalent in a certain basis.
 * Returns null if any two bases are collinear.
 * @param {vec3} v The vector to represent in the given basis.
 * @param {vec3} e1 Basis vector 1.
 * @param {vec3} e2 Basis vector 2.
 * @param {vec3} e3 Basis vector 3.
 * @returns {vec3|null} The vector representing the input vector in the given basis.
 */
function getVecInBasis(v, e1, e2, e3) {
    for (let i = 0; i < 3; i++) for (let j = i+1; j < 3; j++) {
        const cross = vec3.create(); vec3.cross(cross, [e1,e2,e3][i], [e1,e2,e3][j]);
        if (vec3.length(cross) === 0) return null;
    }

    const basis = mat3.create();
    mat3.set(basis,
        e1[0], e2[0], e3[0],
        e1[1], e2[1], e3[1],
        e1[2], e2[2], e3[2],
    );

    const invBasis = mat3.create(); mat3.invert(invBasis, basis);
    const result = vec3.create(); vec3.transformMat3(result, v, invBasis);

    return result;
}

export {
    avgArray,
    wAvgArray,
    distanceToPlane,
    avgPoints,
    DIRECTIONS,
    unNoise,
    getEulerAnglesFromMatrix,
    getQuatFromEulerRad,
    projectPointOnPlane,
    getVecInBasis
}