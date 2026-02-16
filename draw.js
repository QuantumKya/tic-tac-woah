import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";
import { loadShaderFiles, initShader, shaderSet } from "./shaders.js";
import { Quadrilateral } from "./shapez.js";
import { DIRECTIONS } from "./math_stuff.js";
import { COLORS } from "./color.js";

shaderSet.default = await loadShaderFiles();
main();


function draw(gl, programInfo) {
    
    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);

    // ================================ MAKE SHAPES ================================ //

    const scaledX = vec3.scale(vec3.create(), DIRECTIONS.X, 2);
    const scaledY = vec3.scale(vec3.create(), DIRECTIONS.Y, 2);
    const scaledZ = vec3.scale(vec3.create(), DIRECTIONS.Z, 2);

    // Make cube
    const f1 = Quadrilateral.fromSides(vec3.fromValues(-1.0,-1.0,-1.0), scaledX, scaledY);
    const f2 = Quadrilateral.fromSides(vec3.fromValues(-1.0,-1.0,-1.0), scaledX, scaledZ);
    const f3 = Quadrilateral.fromSides(vec3.fromValues(-1.0,-1.0,-1.0), scaledY, scaledZ);
    const f4 = Quadrilateral.fromSides(vec3.fromValues( 1.0, 1.0, 1.0), scaledX, scaledY);
    const f5 = Quadrilateral.fromSides(vec3.fromValues( 1.0, 1.0, 1.0), scaledX, scaledZ);
    const f6 = Quadrilateral.fromSides(vec3.fromValues( 1.0, 1.0, 1.0), scaledY, scaledZ);
    const faces = [f1,f2,f3,f4,f5,f6];
    f1.setColor(COLORS.RED);
    f2.setColor(COLORS.BLUE);
    f3.setColor(COLORS.GREEN);
    f4.setColor(COLORS.YELLOW);
    f5.setColor(COLORS.CYAN);
    f6.setColor(COLORS.MAGENTA);

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
    drawScene(gl, programInfo, buffers);

    requestAnimationFrame(() => draw(gl, programInfo));
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