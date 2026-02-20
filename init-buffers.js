/**
 * @param {WebGLRenderingContext} gl 
 * @param {Array<number>} positions 
 * @param {Array<number>} colors 
 * @param {Array<number>} indices 
 * @returns {{position: WebGLBuffer, color: WebGLBuffer, indices: WebGLBuffer, indexCount: number }}
 */
function initBuffers(gl, positions, colors, indices) {
    const positionBuffer = initPositionBuffer(gl, positions);
    const colorBuffer = initColorBuffer(gl, colors);
    const indexBuffer = initIndexBuffer(gl, indices);

    const numOfIndices = gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE) / Uint16Array.BYTES_PER_ELEMENT;
    return {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer,
        indexCount: Math.min(2048, numOfIndices),
    };
}

// ============================= POSITION BUFFER ============================= //

function initPositionBuffer(gl, positions) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
    return positionBuffer;
}

// ============================= COLOR BUFFER ============================= //

function initColorBuffer(gl, colors) {
    const clrBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, clrBuffer);
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
    return clrBuffer;
}

// ============================= INDEX BUFFER ============================= //

/**
 * @param {WebGLRenderingContext} gl 
 * @param {Array<number>} indices 
 * @returns {WebGLBuffer}
 */
function initIndexBuffer(gl, indices) {
    const idxBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    return idxBuffer;
}


export { initBuffers };