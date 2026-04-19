import { avgArray, avgPoints, DIRECTIONS, getVecInBasis, projectPointOnPlane } from "./math_stuff.js";
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

    /** @returns {vec3[]|null} */
    getBasis() {
        const getCross = (v) => {
            const crossV = vec3.cross(vec3.create(), this.normal, v); vec3.normalize(crossV, crossV); return crossV;
        };
        const crossX = getCross(DIRECTIONS.X);
        const crossY = getCross(DIRECTIONS.Y);
        const crossZ = getCross(DIRECTIONS.Z);
        const crossXY = getCross(DIRECTIONS.XY);
        const crossYZ = getCross(DIRECTIONS.YZ);
        const crossXZ = getCross(DIRECTIONS.XZ);

        for (const v of [crossX, crossY, crossZ, crossXY, crossYZ, crossXZ]) {
            if (vec3.length(v) <= 1e-4) continue;

            const other = vec3.cross(vec3.create(), v, this.normal); vec3.normalize(other, other);  
            return [ v, other, this.normal ];
        }
        return null;
    }

    /** @returns {vec3} */
    getVecInMyBasis(vec) {
        const basis = this.getBasis();
        if (!basis) return null;
        return getVecInBasis(vec, ...basis);
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

        //this.sortVerticesByAngle();
    }

    /** @returns {vec3} */
    get centroid() {
        return avgPoints(...this.vertices);
    }

    /**
     * Set the color of the shape.
     * @param {Color} clr 
     */
    setColor(clr) {
        this.color = clr ?? COLORS.NONE;
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

    /** @returns {Float32Array} */
    getColors() {
        return new Float32Array(
            this.vertices.flatMap(v => this.color.rgba)
        );
    }
}

class Polygon extends DrawnShape {
    constructor(...points) {
        super(...points);
        this.indices = this.constituentTriangleIndices.flat();
    }

    /**
     * Get a polygon from its vertices.
     * @param  {...vec3} points The 3D positions of the vertices.
     * @returns {Polygon|null} 
     */
    static fromPoints(...points) {
        const poly = new Polygon(...points);
        
        if (poly.constituentTriangles.some(t=>!t)) return null;
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

    get area() {
        return this.constituentTriangles.map(t => t.area).reduce((a,b) => a+b, 0);
    }

    getIndexBuffer() {
        return new Uint16Array(this.indices);
    }

    /** @param {Camera} cam  */
    isHoveredUpon(cam) {
        const mP = getMousePos();
        const { origin: rayOrigin, dir: rayDir } = cam.getRaycastFromMouse(mP);

        const résultat = this.constituentTriangles.some(tri => tri.doesRayIntersect(rayOrigin, rayDir));
        return résultat;
    }

    /** @returns {Plane} */
    getPlane() {
        const kendra = this.centroid; // centroid POINT
        const kpaths = this.vertices.map(v => vec3.subtract(vec3.create(), v, kendra));

        const normals = [];
        for (let i = 0; i < this.vertices.length; i++) for (let j = 0; j < i; j++) {
            const v1 = kpaths[i]; const v2 = kpaths[j];
            const cross = vec3.cross(vec3.create(), v1, v2);
            vec3.normalize(cross, cross);
            normals.push(cross);
        }
        if (normals.length === 0) return null;

        const avgdir = vec3.create();
        for (const n of normals) {
            // this side-correction favors the first two vertices — I don't know a better solution
            if (vec3.dot(n, normals[0]) < 0)
                vec3.negate(n, n);
            
            vec3.add(avgdir, avgdir, n);
        }
        vec3.normalize(avgdir, avgdir);

        const polyplane = Plane.fromNormalAndPoint(avgdir, kendra);
        return polyplane;
    }

    /** @returns {Quadrilateral} */
    getMatchingSquare(aspectRatio = 1) {
        const polyplane = this.getPlane();
        // fallback (cursed)
        if (!polyplane) return null;

        const kpaths = this.vertices.map(v => vec3.subtract(vec3.create(), v, polyplane.anchor));

        let t = -1;
        let minDist = Infinity;
        for (let i = 0; i < kpaths.length; i++) {
            const dist = vec3.length(kpaths[i]);
            if (dist < minDist) {
                minDist = dist;
                t = i;
            }
        }

        const tangent1 = kpaths[t];
        const tangent2 = vec3.create(); vec3.cross(tangent2, tangent1, polyplane.normal);
        
        const sqSize = 0.95*minDist;
        vec3.normalize(tangent1, tangent1); vec3.normalize(tangent2, tangent2);
        vec3.scale(tangent1, tangent1, sqSize); vec3.scale(tangent2, tangent2, sqSize*aspectRatio);

        const corner = vec3.create();
        vec3.add(corner, polyplane.anchor, tangent1); vec3.add(corner, corner, tangent2);
        vec3.add(corner, corner, vec3.scale(vec3.create(), polyplane.normal, 0.025));

        const side1 = vec3.scale(vec3.create(), tangent1, -2);
        const side2 = vec3.scale(vec3.create(), tangent2, -2);
        return Quadrilateral.fromSides(corner, side1, side2);
    }

    /*
    sortVerticesByAngle() {
        const kendra = this.centroid;
        const polyplane = this.getPlane();
        if (!polyplane) return;

        const basis = polyplane.getBasis();
        if (!basis) return;

        // Use first vertex as reference for angle calculations
        const ref = this.vertices[0];
        const offsetRef = vec3.subtract(vec3.create(), ref, kendra);
        const basisRef = getVecInBasis(offsetRef, ...basis);

        const tmp = vec3.create();
        this.vertices.sort((a, b) => {
            if (a === ref) return -1;
            if (b === ref) return 1;
            
            const offsetA = vec3.subtract(vec3.create(), a, kendra);
            const offsetB = vec3.subtract(vec3.create(), b, kendra);
            const basisA = getVecInBasis(offsetA, ...basis);
            const basisB = getVecInBasis(offsetB, ...basis);

            const angleCrossA = vec3.create(); vec3.cross(angleCrossA, basisA, basisRef);
            const signedMagA = vec3.dot(angleCrossA, polyplane.normal);
            const angleCrossB = vec3.create(); vec3.cross(angleCrossB, basisB, basisRef);
            const signedMagB = vec3.dot(angleCrossB, polyplane.normal);

            if (signedMagA !== signedMagB) return Math.sign(signedMagA - signedMagB);

            // Tie-breaker for equal angles (e.g., annulus inner/outer points): sort by distance from centroid
            const distA = vec3.length(offsetA);
            const distB = vec3.length(offsetB);
            return distA - distB;
        });
    }
    */

    /** @returns {Float32Array} */
    getTextureBuffer() {
        const polyplane = this.getPlane();
        if (!polyplane) return null;

        const [ tangent, bitangent, z ] = polyplane.getBasis();

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

class Triangle extends Polygon {
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
        return (bary.α >= 0 && bary.β >= 0 && bary.γ >= 0) && (Math.abs(sum - 1) <= 1e-6);
    }

    // redundancy overrides
    get constituentTriangles() { return this; }
    get allTriangles() { return this; }
    sortVerticesByAngle() {}

    getIndexBuffer() {
        return [0, 1, 2];
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
        else return null;
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

class PolygonGroup extends DrawnShape {
    /** @param {...Polygon} polys */
    constructor(...polys) {
        super(...polys.flatMap(p => p.vertices));
        this.polygons = polys;
    }

    /** @returns {Float32Array} */
    getVertices() {
        return new Float32Array(
            this.polygons.flatMap(p => [...p.getVertices()])
        );
    }

    /** @returns {Float32Array} */
    getColors() {
        return new Float32Array(
            this.polygons.flatMap(p => [...p.getColors()])
        );
    }

    /** @returns {Uint16Array} */
    getIndexBuffer() {
        let vertexOffset = 0;
        const indices = [];
        for (const p of this.polygons) {
            const polyIndices = p.getIndexBuffer();
            for (const idx of polyIndices) {
                indices.push(idx + vertexOffset);
            }
            vertexOffset += p.vertices.length;
        }
        return new Uint16Array(indices);
    }

    /** @returns {Float32Array} */
    getTextureBuffer() {
        return new Float32Array(
            this.polygons.flatMap(p => [...p.getTextureBuffer()])
        );
    }

    isHoveredUpon(cam) {
        return this.polygons.some(p => p.isHoveredUpon(cam));
    }
    setColor(color) {
        this.polygons.forEach(p => p.setColor(color));
    }
}



export {
    DrawnShape,
    Triangle, Polygon, Quadrilateral,
    PolygonGroup
}