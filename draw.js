import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";
import { loadShaderFiles, initShader, shaderSet } from "./shaders.js";
import { Polygon, Quadrilateral } from "./shapez.js";
import { DIRECTIONS } from "./math_stuff.js";
import { Color, COLORS } from "./color.js";

shaderSet.default = await loadShaderFiles();

// ================================ STUFF THAT CHANGES ================================ //
let cubeRotation = 0.0;


main();

/** @returns {Array<DrawnShape>} */
function makeShapes() {

}

function draw(gl, programInfo) {
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // ================================ MAKE SHAPES ================================ //

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


    const color1 = Color.lerpColors(COLORS.BROWN, COLORS.WHITE, 1/3);
    const color2 = COLORS.BROWN;
    
    // hover highlight
    
    
    
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
        poly.setColor((n%2) ? color1 : color2);
        faces.push(poly);
    }



    // ================================ PROCESS SHAPES ================================ //

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