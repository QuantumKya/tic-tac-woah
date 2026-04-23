import { Color, COLORS } from "./color.js";
import { Geometry, Material, RenderObject } from "./geometry.js";
import { DIRECTIONS } from "./math_stuff.js";
import { Polygon, PolygonGroup, Quadrilateral } from "./shapez.js";

/**
 * @param {vec3} center The center of the sphere.
 * @param {number} rad The radius of the sphere.
 * @param {((number, number) => Color)} colorF A function to determine the color of a sphere segment. Takes in theta section and phi section as arguments.
 * @returns {{ shapes: Array<Polygon>, renderers: Array<RenderObject> }}
 */
function makeSphere(center, rad, colorF, azimuthalParts = 1, verticalParts = 1) {
    
    const radius = rad;
    const kendra = center;

    const thetaRegions = Math.max(3, azimuthalParts);
    const phiRegions = Math.max(3, verticalParts);
    const thetaPer = (thetaRegions > 40) ? 1 : Math.floor(40 / thetaRegions);
    const phiPer = (phiRegions > 40) ? 1 : Math.floor(40 / phiRegions);

    const sphereFaces = [];
    const sphereRenders = [];
    const sphereMaterial = Material.NONE;
    

    const thetarad = Math.PI * 2 / thetaRegions;
    const phirad = Math.PI / phiRegions;
    for (let p = 0; p < phiRegions; p++) {
        const inphi = p*phirad;
        
        for (let t = 0; t < thetaRegions; t++) {
            const intheta = t*thetarad;
            const polys = [];
            
            const pos = (theta, phi) => {
                const offset = vec3.fromValues(
                    radius*Math.sin(phi)*Math.cos(theta),
                    radius*Math.cos(phi),
                    radius*Math.sin(phi)*Math.sin(theta)
                );
                const circlepoint = vec3.create();
                vec3.add(circlepoint, center, offset);
                return circlepoint;
            };

            for (let i = 0; i < thetaPer; i++) {
                const tper1 = intheta + i/thetaPer*thetarad;
                const tper2 = intheta + (i+1)/thetaPer*thetarad;
                for (let j = 0; j < phiPer; j++) {
                    const pper1 = inphi + j/phiPer*phirad;
                    const pper2 = inphi + (j+1)/phiPer*phirad;

                    const verts = [];

                    if (p === 0 && j === 0) verts.push(
                        pos(tper1, pper2),
                        pos(tper2, pper2),
                        pos(tper2, pper1),
                    );
                    else if (p === phiRegions-1 && j === phiPer-1) verts.push(
                        pos(tper1, pper1),
                        pos(tper2, pper1),
                        pos(tper2, pper2)
                    );
                    else verts.push(
                        pos(tper1, pper1),
                        pos(tper1, pper2),
                        pos(tper2, pper2),
                        pos(tper2, pper1),
                    );

                    const poly = Polygon.fromPoints(...verts);
                    if (!poly) continue;
                    polys.push(poly);
                }
            }
            
            const groupPoly = new PolygonGroup(...polys);
            groupPoly.setColor(colorF(t, p));
            sphereFaces.push(groupPoly);

            const geom = Geometry.fromPolygon(groupPoly);
            sphereRenders.push(new RenderObject(geom, sphereMaterial));
        }
    }



    return { shapes: sphereFaces, renderers: sphereRenders };
}

/**
 * @param {vec3} center The center of the cube.
 * @param {number} sideLength The side length of the cube.
 * @param {{ xy: Color, mxy: Color, yz: Color, myz: Color, xz: Color, mxz: Color }} colorF An object mapping faces to desired colors. Entry names are the names of the plane the corresponding face sits on (e.g., "xy", where "mxy" is its opposite face).
 * @returns {{ sides: Array<Polygon>, renderer: RenderObject }}
 */
function makeCube(center, sideLength, colorF) {
    const cubeRadius = sideLength/2;
    const scaledX = vec3.scale(vec3.create(), DIRECTIONS.X, cubeRadius*2);
    const scaledY = vec3.scale(vec3.create(), DIRECTIONS.Y, cubeRadius*2);
    const scaledZ = vec3.scale(vec3.create(), DIRECTIONS.Z, cubeRadius*2);
    const halfMXYZ = vec3.scaleAndAdd(vec3.create(), center, DIRECTIONS.XYZ, -cubeRadius);

    return makeParallelopiped(halfMXYZ, scaledX, scaledY, scaledZ, colorF);
}

/**
 * Create a renderer and a shapeset for an arbitrary parallelopiped.  
 * If any two edges are collinear, or if all three are coplanar, only one face will be returned due to degeneracy.
 * @param {vec3} corner A corner of the parallelopiped, from which the edges are cast.
 * @param {vec3} edge1 One edge of the parallelopiped.
 * @param {vec3} edge2 Another edge of the parallelopiped.
 * @param {vec3} edge3 The final edge of the parallelopiped.
 * @param {{ xy: Color, mxy: Color, yz: Color, myz: Color, xz: Color, mxz: Color }} colorF An object mapping faces to desired colors. Entry names are the names of the plane the corresponding face sits on (e.g., "xy", where "mxy" is its opposite face).
 * @returns {{ sides: Array<Polygon>, renderer: RenderObject }}
 */
function makeParallelopiped(corner, edge1, edge2, edge3, colorF) {
    const edges = [edge1, edge2, edge3];
    const temp = vec3.create();

    // triple product check!!! Thank you Ms. Higgy for Calc BC knowlegde :)
    vec3.cross(temp, edge1, edge2);
    if (Math.abs(vec3.dot(temp, edge3)) < 1e-6) {
        // degenerate case — hope there's a valid parallelogram somewhere!
        for (let i = 0; i < 3; i++) for (let j = i+1; j < 3; j++) {
            vec3.cross(temp, edges[i], edges[j]);
            if (vec3.length(temp) < 1e-6) continue;

            const poly = Quadrilateral.fromSides(corner, edges[i], edges[j]);
            return {
                sides: [poly],
                renderer: new RenderObject(Geometry.fromPolygon(poly), new Material({}))
            };
        }
        return null;
    }



    // actual SHAPE GENERATION
    const farPoint = vec3.create();
    vec3.add(farPoint, corner, edge1);
    vec3.add(farPoint, farPoint, edge2);
    vec3.add(farPoint, farPoint, edge3);

    const closeSides = edges.map((_,i,a) => {
        const rem = a.filter((_,k)=>k!==i);
        const poly = Quadrilateral.fromSides(corner, ...rem);

        const keystr = [...'xyz'].filter((_,k)=>k!==i).join('');
        poly.setColor(colorF[keystr]);
        return poly;
    });
    const farSides = edges.map((_,i,a) => {
        const rem = a.filter((_,k)=>k!==i)
            .map(e => vec3.negate(vec3.create(), e));
        const poly = Quadrilateral.fromSides(farPoint, ...rem);

        const keystr = 'm' + [...'xyz'].filter((_,k)=>k!==i).join('');
        poly.setColor(colorF[keystr]);
        return poly;
    });


    const sides = [...closeSides, ...farSides];

    const geom = Geometry.fromPolygons(...sides);
    const mat = Material.NONE;
    const renderer = new RenderObject(geom, mat);

    return { sides, renderer };
}

/**
 * 
 * @param {vec3} center The center of the annulus.
 * @param {number} radius The outer radius of the annulus.
 * @param {number} innerRows The number of empty rows in the center.
 * @param {number} outerRows The number of un-empty rows, after the empty ones.
 * @param {number} slices 
 * @param {((number, number) => Color)} colorF A function to determine the color of a face.
 * @returns 
 */
function makeAnnulus(center, radius, innerRows, outerRows, slices, colorF) {
    
    const rows = outerRows;
    const per = (slices > 40) ? 1 : Math.floor(40 / slices);

    const wheelFaces = [];
    const wheelMaterial = Material.NONE;
    const wheelRenderers = [];
    
    
    const rowrad = radius/(rows+1);
    for (let r = innerRows; r <= rows; r++) {
        const inrad = r*rowrad;
        const outrad = (r+1)*rowrad;

        for (let n = 0; n < slices; n++) {
            const verts = [];
            
            const fromRad = (rad, direction) => {
                for (let i = 0; i <= per; i++) {
                    const thetaIndex = (n + Math.max(0, -direction) + direction * i/per);
                    const angle = thetaIndex * 2*Math.PI / slices;
                    
                    const offset = vec3.fromValues(
                        rad*Math.cos(angle),
                        0,
                        -rad*Math.sin(angle),
                    );
                    vec3.add(offset, offset, center);
                    verts.push(offset);
                }
            }

            fromRad(inrad, 1);
            fromRad(outrad, -1);


            
            const poly = Polygon.fromPoints(...verts);
            if (!poly) continue;
            poly.setColor(colorF(r,n));
            wheelFaces.push(poly);

            const geom = Geometry.fromPolygon(poly);
            wheelRenderers.push(new RenderObject(geom, wheelMaterial));
        }
    }

    return { shapes: wheelFaces, renderers: wheelRenderers };
}

export {
    makeSphere, makeCube, makeAnnulus, makeParallelopiped
}