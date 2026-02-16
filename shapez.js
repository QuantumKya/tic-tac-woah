import { avgArray, distanceToPlane, avgPoints, DIRECTIONS } from "./math_stuff.js";
import { getColorBuffer, Color, COLORS } from "./color.js";

class Plane {
    constructor() {}

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
        if (vec3.sqLen(norm) === 0) return null;
        
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
        if (vec3.sqLen(normal) === 0) return null;

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
        const directionDot = vec3.dot(dir, this.plane.normal);
        if (directionDot === 0) return null;

        const originDot = vec3.dot(origin, this.centroid);

        const t = originDot / directionDot;
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
    }

    /**
     * Set the color of the shape.
     * @param {Color} clr 
     */
    setColor(clr) {
        this.color = clr;
    }

    getVertexBuffer() {
        return this.vertices.flatMap(v => [v[0], v[1], v[2]]);
    }

    getColorBuffer() {
        return getColorBuffer(...Array(this.vertices.length).fill(this.color));
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
        return (bary.α > 0 && bary.β > 0 && bary.γ > 0);
    }

    getIndexBuffer() {
        return [0, 1, 2];
    }
}

class Polygon extends DrawnShape {
    constructor(...points) {
        super(...points);
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

    get centroid() {
        return avgPoints(...this.vertices);
    }

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
        for (let i = 2; i < this.vertices.length; i++) {
            tris.push([0, i-1, i]);
        }
        return tris.filter(tri => !!tri);
    }

    /** @returns {Array<Triangle>} */
    get constituentTriangles() {
        return this.constituentTriangleIndices.map(arr => Triangle.fromPoints(...arr));
    }

    getIndexBuffer() {
        return this.constituentTriangleIndices.flat();
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
}



export {
    Triangle, Polygon, Quadrilateral
}