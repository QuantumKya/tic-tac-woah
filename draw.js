loadShaderFiles();
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
    const shader = initShader(gl, vsSource, fsSource);
}

const shaderSet = {
    default: {
        vsSource: '',
        fsSource: '',
    },
};
async function loadShaderFiles() {
    shaderSet.default.vsSource = await (await fetch('vertex.glsl')).text();
    shaderSet.default.fsSource = await (await fetch('fragment.glsl')).text();
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