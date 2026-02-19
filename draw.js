import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";
import { loadShaderFiles, initShader, shaderSet } from "./shaders.js";
import { DrawnShape, Polygon, Quadrilateral } from "./shapez.js";
import { DIRECTIONS } from "./math_stuff.js";
import { Color, COLORS } from "./color.js";
import { getMousePos } from "./input.js";
import Camera from "./camera.js";

shaderSet.default = await loadShaderFiles();

// ================================ STUFF THAT CHANGES ================================ //
let cubeRotation = 0.0;


main();

/**
 * 
 * @param {Camera} cam The camera.
 * @returns {Array<DrawnShape>}
 */
function makeShapes(gl, cam) {

    /*
    const scaledX = vec3.scale(vec3.create(), DIRECTIONS.X, 2);
    const scaledY = vec3.scale(vec3.create(), DIRECTIONS.Y, 2);
    const scaledZ = vec3.scale(vec3.create(), DIRECTIONS.Z, 2);
    const scaledMX = vec3.scale(vec3.create(), DIRECTIONS.MX, 2);
    const scaledMY = vec3.scale(vec3.create(), DIRECTIONS.MY, 2);
    const scaledMZ = vec3.scale(vec3.create(), DIRECTIONS.MZ, 2);

    // Make cube
    const f1 = Quadrilateral.fromSides(vec3.fromValues(-1.0,-1.0,-1.0), scaledX, scaledY);
    const f2 = Quadrilateral.fromSides(vec3.fromValues(-1.0,-1.0,-1.0), scaledX, scaledZ);
    const f3 = Quadrilateral.fromSides(vec3.fromValues(-1.0,-1.0,-1.0), scaledY, scaledZ);
    const f4 = Quadrilateral.fromSides(vec3.fromValues( 1.0, 1.0, 1.0), scaledMX, scaledMY);
    const f5 = Quadrilateral.fromSides(vec3.fromValues( 1.0, 1.0, 1.0), scaledMX, scaledMZ);
    const f6 = Quadrilateral.fromSides(vec3.fromValues( 1.0, 1.0, 1.0), scaledMY, scaledMZ);
    const faces = [f1,f2,f3,f4,f5,f6];
    f1.setColor(COLORS.RED);
    f2.setColor(COLORS.BLUE);
    f3.setColor(COLORS.GREEN);
    f4.setColor(COLORS.YELLOW);
    f5.setColor(COLORS.CYAN);
    f6.setColor(COLORS.MAGENTA);
    */


    const faces = [];
    
    const radius = 2;
    const numOfRegions = 12;
    const per = 3;

    const center = vec3.fromValues(0, -1, 0);
    
    for (let n = 0; n < numOfRegions; n++) {
        const verts = [];
        verts.push(center);
        
        for (let i = 0; i <= per; i++) {
            const angle = (n + i/per) * 2*Math.PI / numOfRegions;
            
            const offset = vec3.fromValues(
                radius*Math.cos(angle),
                0,
                -radius*Math.sin(angle),
            );
            const circlepoint = vec3.create();
            vec3.add(circlepoint, center, offset);
            verts.push(circlepoint);
        }
        
        const poly = Polygon.fromPoints(...verts);
        faces.push(poly);
    }
    

    
    const color1 = Color.lerpColors(COLORS.BROWN, COLORS.WHITE, 1/3);
    const color2 = COLORS.BROWN;

    // hover highlight
    faces.forEach((f, i) => {
        const mP = getMousePos();
        const { origin: rayOrigin, dir: rayDir } = cam.getRaycastFromMouse(mP);

        const résultat = f.constituentTriangles.some(tri => tri.doesRayIntersect(rayOrigin, rayDir));

        const newColor1 = résultat ? COLORS.WHITE : color1;
        const newColor2 = résultat ? COLORS.WHITE : color2;

        f.setColor((i%2) ? newColor1 : newColor2);
    });



    return faces;
}

function draw(gl, programInfo) {
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);


    // ================================ CAMERA CAMERA CAMERA ================================ //

    let fieldOfView = (45 * Math.PI) / 180; // in radians
    let zNear = 0.1;
    let zFar = 100.0;
    
    const camera = new Camera(
        gl,
        fieldOfView,
        zNear,
        zFar,
        vec3.fromValues(0, 0, 6)
    );

    // ================================ CHANGE THAT MATRIX ================================ //

    camera.setMatrixFn((mat) => {
        mat4.rotate(mat, mat,
            Math.PI / 2,
            [1, 0, 0],
        );
        mat4.rotate(mat, mat,
            cubeRotation,
            [0, 1, 0],
        );

        return mat;
    });

    // ================================ PROCESS SHAPES ================================ //
    
    const faces = makeShapes(gl, camera);

    const positions = [];
    const colors = [];
    const indices = [];
    let vertexOffset = 0;

    for (const f of faces) {
        positions.push(...f.getVertexBuffer());
        colors.push(...f.getColorBuffer());
        indices.push(...f.getIndexBuffer().map(i => i + vertexOffset));
        vertexOffset += f.vertices.length;
    }
    

    // ================================ DRAW & LOOP ================================ //

    programInfo.camera = camera;
    
    const buffers = initBuffers(gl, positions, colors, indices);
    drawScene(gl, programInfo, buffers, cubeRotation);

    requestAnimationFrame(() => draw(gl, programInfo));
    cubeRotation += 0.01;
}

function main() {
    const canvas = document.querySelector('canvas');
    // Initialize the GL context
    const gl = canvas.getContext('webgl');

    // Only continue if WebGL is available and working
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }



    const vsSource = shaderSet.default.vsSource;
    const fsSource = shaderSet.default.fsSource;
    const shaderProgram = initShader(gl, vsSource, fsSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
            vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
        },
    }

    draw(gl, programInfo);
}