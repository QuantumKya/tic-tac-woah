import { initBuffers, initColorBuffer } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";
import { loadShaderFiles, initShader, shaderSet } from "./shaders.js";

shaderSet.default = await loadShaderFiles();
main();


function main() {
    const canvas = document.querySelector('canvas');
    // Initialize the GL context
    const gl = canvas.getContext('webgl');

    // Only continue if WebGL is available and working
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);

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

    const buffers = initBuffers(gl);
    drawScene(gl, programInfo, buffers);
}