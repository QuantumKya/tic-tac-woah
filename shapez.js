import { avgArray, distanceToPlane, avgPoints, DIRECTIONS } from "./math_stuff";
import { getColorBuffer, Color, COLORS } from "./color";

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
        this.color = COLORS.GREY;
    }

    /**
     * 
     * @param {Color} clr 
     */
    setColor(clr) {
        this.color = clr;
    }

    getVertexBuffer() {
        return this.vertices.map(v => [v[0], v[1], v[2]]).flat();
    }

    getColorBuffer() {
        return getColorBuffer(this.vertices.map(a=>this.color));
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
        if (!tri.plane) return null;
        return tri;
    }

    get centroid() {
        return avgPoints(this.v1, this.v2, this.v3);
    }

    get plane() {
        return Plane.fromPoints(this.v1, this.v2, this.v3);
    }

    get edgeVectorX() { return this.#getClosestToDir(DIRECTIONS.X); }
    get edgeVectorY() { return this.#getClosestToDir(DIRECTIONS.Y); }
    get edgeVectorZ() { return this.#getClosestToDir(DIRECTIONS.Z); }

    #getClosestToDir(dir) {
        // Find the vertex closest aligned to the given axis
        const dirFactors = this.vertices.map(v => Math.abs( vec3.dot(v, dir) ));
        return this.vertices[dirFactors.indexOf(Math.max(...dirFactors))];
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
        if (poly.allTriangles.includes(null)) return null;
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
        return tris;
    }
}