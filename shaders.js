// ============================= SHADERS ============================= //

const shaderSet = {};
async function loadShaderFiles() {
    const vsSource = await (await fetch('vertex.glsl')).text();
    const fsSource = await (await fetch('fragment.glsl')).text();
    return { vsSource, fsSource };
}

function initShader(gl, vertex, fragment) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertex);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragment);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize shader program :ε');
        console.log(gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    // Send the source to the shader object
    gl.shaderSource(shader, source);

    // Compile the shader program
    gl.compileShader(shader);

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

export { loadShaderFiles, initShader, shaderSet };