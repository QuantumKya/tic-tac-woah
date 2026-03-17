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

export {
    avgArray,
    wAvgArray,
    distanceToPlane,
    avgPoints,
    DIRECTIONS,
    unNoise,
    getEulerAnglesFromMatrix,
}