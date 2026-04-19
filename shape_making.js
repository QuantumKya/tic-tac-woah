import { Color, COLORS } from "./color.js";
import { Geometry, Material, RenderObject } from "./geometry.js";
import { Polygon, PolygonGroup } from "./shapez.js";

/**
 * @param {WebGLRenderingContext} gl The WebGL renderer.
 * @param {vec3} kendra The center of the sphere.
 * @param {number} rad The radius of the sphere.
 * @param {((number, number) => Color)} colorF A function to determine the color of a sphere segment
 * @returns {{ shapes: Array<Polygon>, renderers: Array<RenderObject> }}
 */
function makeSphere(kendra, rad, colorF, azimuthalParts = 1, verticalParts = 1) {
    
    const radius = rad;
    const center = kendra;

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

export {
    makeSphere
}