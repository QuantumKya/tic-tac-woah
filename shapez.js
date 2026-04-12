import { avgPoints, DIRECTIONS } from "./math_stuff.js";
import { Color, COLORS } from "./color.js";
import { TEXTURES } from "./textures.js";
import { getMousePos } from "./input.js";
import Camera from "./camera.js";

class Plane {
    constructor() {
        this.normal = vec3.create();
        this.anchor = vec3.create();
    }

    /**
     * Get a plane from three non-collinear points.
     * @param {vec3} p1 The 3D position of the vertex.
     * @param {vec3} p2 The 3D position of the vertex.
     * @param {vec3} p3 The 3D position of the vertex.
     * @returns {Plane|null} The produced plane (null if points are collinear).
     */
    static fromPoints(p1, p2, p3) {
        // find planar vectors
        const planev1 = vec3.create();
        const planev2 = vec3.create();
        vec3.subtract(planev1, p2, p1);
        vec3.subtract(planev2, p3, p1);

        // take cross product
        const norm = vec3.create();
        vec3.cross(norm, planev1, planev2);
        if (vec3.length(norm) === 0) return null;
        
        vec3.normalize(norm, norm);

        // centroid finding
        const centroid = avgPoints(p1, p2, p3);

        const plane = new Plane();
        plane.normal = norm;
        plane.anchor = centroid;
        return plane;
    }

    /**
     * Get a plane from a point and a normal vector.
     * @param {vec3} normal A normal vector of the plane.
     * @param {vec3} point A point lying on the plane.
     * @returns {Plane|null} The produced plane (null if points are collinear).
     */
    static fromNormalAndPoint(normal, point) {
        if (vec3.length(normal) === 0) return null;

        // normal should be normalized
        const norm = vec3.create();
        vec3.normalize(norm, normal);
        
        const plane = new Plane();
        plane.normal = norm;
        plane.anchor = point;
        return plane;
    }

    /**
     * Find the intersection of a ray and the plane.
     * @param {vec3} origin The position that the raycast comes from.
     * @param {vec3} dir The direction of the raycast.
     * @returns {vec3|null} The intersection point of the ray and the triangle. Returns null if no intersection.
     */
    checkRayIntersect(origin, dir) {
        const directionDot = vec3.dot(dir, this.normal);
        if (Math.abs(directionDot) <= 1e-6) return null;

        const diff = vec3.create();
        vec3.subtract(diff, this.anchor, origin);

        const diffDot = vec3.dot(diff, this.normal);

        const t = diffDot / directionDot;
        if (t < 0) return null;

        const p = vec3.create();
        vec3.scaleAndAdd(p, origin, dir, t);
        return p;
    }
}

class DrawnShape {
    /**
     * 
     * @param  {...vec3} points The 3D positions of the vertices.
     */
    constructor(...points) {
        this.vertices = points;
        this.color = COLORS.GRAY;
        this.texture = TEXTURES.BLANK;
    }

    get centroid() {
        return avgPoints(...this.vertices);
    }

    /**
     * Set the color of the shape.
     * @param {Color} clr 
     */
    setColor(clr) {
        this.color = clr;
    }
    
    /**
     * Set the shape's texture to use.
     * Use TEXTURES.BLANK when using only color.
     * @param {WebGLTexture} tex 
     */
    setTexture(tex) {
        this.texture = tex ?? TEXTURES.MISSING;
    }

    /** @returns {Float32Array} */
    getVertices() {
        return new Float32Array(
            this.vertices.flatMap(v => [...v])
        );
    }

    getColors() {
        return new Float32Array(
            this.vertices.flatMap(v => this.color.rgba)
        );
    }

    getMatchingSquare() {
        const kendra = this.centroid; // centroid POINT
        const tangent1 = vec3.subtract(vec3.create(), this.vertices[0], kendra);
        const tangent2 = vec3.subtract(vec3.create(), this.vertices[1], kendra);
        const cross = vec3.cross(vec3.create(), tangent1, tangent2);

        const polyplane = Plane.fromNormalAndPoint(cross, kendra);
        // fallback (cursed)
        if (!polyplane) { return new Float32Array(this.vertices.flatMap((_,i) => [i%2, Math.floor(i/2) % 2])); }

        
        // orthovectors
        let nonbasis = -1;
        const dirs = [DIRECTIONS.X, DIRECTIONS.Y, DIRECTIONS.Z].map((d, i) => {
            // finding the closest direction to the normal vector and NOT using it
            //     ...because doing so may lead to undefined or otherwise spooky behavior
            const a = vec3.angle(d, cross);
            if (a < Math.PI/4) { nonbasis = i; return d; }

            // casting down to plane to get some bases
            const centerd = vec3.create(); vec3.add(centerd, kendra, d);
            const basisd = projectPointOnPlane(centerd, polyplane);
            vec3.subtract(basisd, basisd, kendra);
            
            return basisd;
        });
        if (nonbasis === -1) dirs[1] = DIRECTIONS.Y; // if all of the vectors are fine-ish, just use the XZ plane.
        const restrictedArr = [0, 1, 2].filter(i !== nonbasis); // filtering to get rid of the unused basis.


        
        let minA = Infinity; let maxA = -Infinity;
        let minB = Infinity; let maxB = -Infinity;
        for (const v of this.vertices) {
            const projectee = projectPointOnPlane(v, polyplane);

            const relativeVec = getVecInBasis(projectee, ...dirs);

            const c0 = relativeVec[restrictedArr[0]];
            const c1 = relativeVec[restrictedArr[1]];
            minB = Math.min(minB, c0); maxB = Math.max(maxB, c1);
            minA = Math.min(minA, c0); maxA = Math.max(maxA, c1);
        }

        const diffA = maxA - minA;
        const diffB = maxB - minB;
        // uses the average here as not to be too big, but can use anything else
        const squareSize = (diffA + diffB) / 2;

        const boundBasisA = vec3.create(); vec3.scale(boundBasisA, dirs[restrictedArr[0]], squareSize);
        const boundBasisB = vec3.create(); vec3.scale(boundBasisB, dirs[restrictedArr[1]], squareSize);

        const diag = vec3.create(); vec3.add(diag, boundBasisA, boundBasisB);
        const corner = vec3.create(); vec3.subtract(corner, kendra, diag);

        const sq = Quadrilateral.fromSides(corner,
            vec3.scale(vec3.create(), boundBasisA, 2),
            vec3.scale(vec3.create(), boundBasisB, 2)
        );
        return sq;
    }

    getTextureBuffer() {
        const kendra = this.centroid; // centroid POINT
        const tangent1 = vec3.subtract(vec3.create(), this.vertices[0], kendra);
        const tangent2 = vec3.subtract(vec3.create(), this.vertices[1], kendra);
        const cross = vec3.cross(vec3.create(), tangent1, tangent2);

        const polyplane = Plane.fromNormalAndPoint(cross, kendra);
        if (!polyplane) { // fallback (cursed)
            return new Float32Array(this.vertices.flatMap((_,i) => [i%2, Math.floor(i/2) % 2]));
        }

        // Create two orthogonal vectors in the plane
        const tangent = vec3.create();
        vec3.subtract(tangent, this.vertices[1], this.vertices[0]);
        vec3.normalize(tangent, tangent);

        const bitangent = vec3.create();
        vec3.cross(bitangent, polyplane.normal, tangent);

        // Project vertices onto the plane and compute UV
        const uvs = [];
        let minU = Infinity, maxU = -Infinity;
        let minV = Infinity, maxV = -Infinity;
        const projectedUVs = [];

        for (const vert of this.vertices) {
            const fromAnchor = vec3.create(); vec3.subtract(fromAnchor, vert, polyplane.anchor);
            const u = vec3.dot(fromAnchor, tangent);
            const v = vec3.dot(fromAnchor, bitangent);
            
            projectedUVs.push({ u, v });
            minU = Math.min(minU, u); maxU = Math.max(maxU, u);
            minV = Math.min(minV, v); maxV = Math.max(maxV, v);
        }

        // Normalize to [0, 1]
        const rangeU = maxU - minU || 1;
        const rangeV = maxV - minV || 1;

        for (const { u, v } of projectedUVs) {
            uvs.push((u - minU) / rangeU, (v - minV) / rangeV);
        }

        return new Float32Array(uvs);
    }
}

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
 * 
 * @param {vec3} v The vector to represent in the given basis.
 * @param {vec3} e1 Basis vector in objective coordinates (will be subtracted from origin vector).
 * @param {vec3} e2 Basis vector in objective coordinates (will be subtracted from origin vector).
 * @param {vec3} e3 Basis vector in objective coordinates (will be subtracted from origin vector).
 */
function getVecInBasis(v, e1, e2, e3) {
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

class Triangle extends DrawnShape {
    constructor(p1, p2, p3) {
        super(p1, p2, p3);
        this.v1 = p1;
        this.v2 = p2;
        this.v3 = p3;
    }

    /**
     * Creates a Triangle from three points.
     * @param {vec3} p1 The 3D position of the vertex.
     * @param {vec3} p2 The 3D position of the vertex.
     * @param {vec3} p3 The 3D position of the vertex.
     * @returns {Triangle|null} The resulting triangle (null if points are collinear).
     */
    static fromPoints(p1, p2, p3) {
        const tri = new Triangle(p1, p2, p3);
        if (tri.area === 0) return null;
        return tri;
    }

    get centroid() {
        return avgPoints(this.v1, this.v2, this.v3);
    }

    get plane() {
        return Plane.fromPoints(this.v1, this.v2, this.v3);
    }

    get edgeVectorAB() { return this.#getEdgeVector(0,1); }
    get edgeVectorAC() { return this.#getEdgeVector(0,2); }
    get edgeVectorBC() { return this.#getEdgeVector(1,2); }
    #getEdgeVector(i1, i2) {
        const diff = vec3.create();
        vec3.subtract(diff, this.vertices[i2], this.vertices[i1]);
        return diff;
    }

    get area() {
        const cross = vec3.create();
        vec3.cross(cross, this.edgeVectorAB, this.edgeVectorAC);
        return vec3.length(cross) / 2;
    }

    /**
     * Get the barycentric coordinates of a point using the triangle.
     * @param {vec3} p The point to find the relative coordinates of.
     * @returns {{ α: number, β: number, γ: number }} The barycentric coordinates [α, β, γ]
     */
    getBarycentric(p) {
        const αTri = Triangle.fromPoints(p, this.v2, this.v3) ?? { area: 0 };
        const βTri = Triangle.fromPoints(p, this.v3, this.v1) ?? { area: 0 };
        const γTri = Triangle.fromPoints(p, this.v1, this.v2) ?? { area: 0 };
        const α = αTri.area / this.area;
        const β = βTri.area / this.area;
        const γ = γTri.area / this.area;

        return { α, β, γ };
    }

    /**
     * Find if a ray intersects the triangle.
     * @param {vec3} origin The position that the raycast comes from.
     * @param {vec3} dir The direction of the raycast.
     * @returns {boolean} Whether the ray intersects.
     */
    doesRayIntersect(origin, dir) {
        const intersect = this.plane.checkRayIntersect(origin, dir);
        if (!intersect) return false;

        const bary = this.getBarycentric(intersect);
        const sum = bary.α + bary.β + bary.γ;
        return (bary.α > 0 && bary.β > 0 && bary.γ > 0) && (Math.abs(sum - 1) <= 1e-6);
    }

    getIndexBuffer() {
        return [0, 1, 2];
    }
}

class Polygon extends DrawnShape {
    constructor(...points) {
        super(...points);
        this.indices = this.constituentTriangleIndices;
    }

    /**
     * Get a polygon from its vertices.
     * @param  {...vec3} points The 3D positions of the vertices.
     * @returns {Polygon|null} 
     */
    static fromPoints(...points) {
        const poly = new Polygon(...points);
        
        if (poly.constituentTriangles.every(a=>!a)) return null;
        return poly;
    }

    /** @returns {Array<Triangle>} */
    get allTriangles() {
        const tris = [];
        for (let i = 0; i < this.vertices.length - 2; i++) {
            for (let j = i+1; j < this.vertices.length - 1; j++) {
                for (let k = j+1; k < this.vertices.length; k++) {
                    tris.push(Triangle.fromPoints(this.vertices[i], this.vertices[j], this.vertices[k]));
                }
            }
        }
        return tris.filter(tri => !!tri);
    }

    /** @returns {Array<Array<number>>} */
    get constituentTriangleIndices() {
        const tris = [];
        let i = 0;
        let j = this.vertices.length-1;

        let k = 1;
        while (j > i+1) {
            tris.push(k%2 ? [i, j, ++i] : [j, i, --j]);
            k++;
        }
        return tris;
    }

    /** @returns {Array<Triangle>} */
    get constituentTriangles() {
        return this.constituentTriangleIndices.map(arr => Triangle.fromPoints(...arr.map(i => this.vertices[i])));
    }

    getIndexBuffer() {
        return new Uint16Array(this.indices.flat());
    }

    /** @param {Camera} cam  */
    isHoveredUpon(cam) {
        const mP = getMousePos();
        const { origin: rayOrigin, dir: rayDir } = cam.getRaycastFromMouse(mP);

        const résultat = this.constituentTriangles.some(tri => tri.doesRayIntersect(rayOrigin, rayDir));
        return résultat;
    }
}

class Quadrilateral extends Polygon {
    constructor(p1, p2, p3, p4) {
        super(p1, p2, p3, p4);
    }

    /**
     * Enter points (in order by angle) to get a quadrilateral.
     * @param {vec3} p1 The 3D position of the vertex.
     * @param {vec3} p2 The 3D position of the vertex.
     * @param {vec3} p3 The 3D position of the vertex.
     * @param {vec3} p4 The 3D position of the vertex.
     * @returns {Quadrilateral|null} The quadrilateral.
     */
    static fromPoints(p1, p2, p3, p4) {
        const quad = new Quadrilateral(p1, p2, p3, p4);
        
        if (Triangle.fromPoints(p1, p2, p3) && Triangle.fromPoints(p1, p3, p4) && Triangle.fromPoints(p1, p2, p4)) return quad;
    }

    /**
     * Get a parallelogram from a corner and two side vectors.
     * @param {vec3} p Corner of the parallelogram.
     * @param {vec3} s1 One side of the parallelogram.
     * @param {vec3} s2 The other side of the parallelogram.
     * @returns {Quadrilateral|null} The parallelogram.
     */
    static fromSides(p, s1, s2) {
        const cross = vec3.create();
        vec3.cross(cross, s1, s2);
        if (vec3.length(cross) === 0) return null;

        const ps1 = vec3.create();
        const ps2 = vec3.create();
        const pss = vec3.create();

        vec3.add(ps1, p, s1);
        vec3.add(ps2, p, s2);
        vec3.add(pss, ps1, s2);

        const para = new Quadrilateral(p, ps1, pss, ps2);
        return para;
    }

    getIndexBuffer() {
        return [0, 1, 2, 0, 2, 3];
    }

    getTextureBuffer() {
        const quadUV = new Float32Array([
            0, 0,
            1, 0,
            1, 1,
            0, 1
        ]);
        return quadUV;
    }
}



export {
    DrawnShape,
    Triangle, Polygon, Quadrilateral
}