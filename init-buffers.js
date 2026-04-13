/**
 * @param {WebGLRenderingContext} gl 
 * @param {Float32Array} positions 
 * @param {Float32Array} colors 
 * @param {Uint16Array} indices 
 * @param {Float32Array} texturepts
 * @returns {import("./draw").BufferSet}
 */
function initBuffers(gl, positions, colors, indices, texturepts) {
    const positionBuffer = initPositionBuffer(gl, positions);
    const colorBuffer = initColorBuffer(gl, colors);
    const indexBuffer = initIndexBuffer(gl, indices);
    const textureBuffer = initTextureBuffer(gl, texturepts);

    const numOfIndices = gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE) / Uint16Array.BYTES_PER_ELEMENT;
    return {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer,
        textures: textureBuffer,
        indexCount: Math.min(2048, numOfIndices),
    };
}

// ============================= POSITION BUFFER ============================= //

/** @param {WebGLRenderingContext} gl @param {Float32Array} positions  */
function initPositionBuffer(gl, positions) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    return positionBuffer;
}

// ============================= COLOR BUFFER ============================= //

/** @param {WebGLRenderingContext} gl @param {Float32Array} colors @returns {WebGLBuffer} */
function initColorBuffer(gl, colors) {
    const clrBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, clrBuffer);
    
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
    return clrBuffer;
}

// ============================= INDEX BUFFER ============================= //

/** @param {WebGLRenderingContext} gl @param {Float32Array} indices @returns {WebGLBuffer} */
function initIndexBuffer(gl, indices) {
    const idxBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    return idxBuffer;
}

// ============================= TEXTURE BUFFER ============================= //

/** @param {WebGLRenderingContext} gl @param {Float32Array} texturepts @returns {WebGLBuffer} */
function initTextureBuffer(gl, texturepts) {
    const textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, texturepts, gl.STATIC_DRAW);
    return textureBuffer;
}


export { initBuffers };