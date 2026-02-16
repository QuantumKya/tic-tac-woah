function initBuffers(gl, positions, colors, indices) {
    const positionBuffer = initPositionBuffer(gl, positions);
    const colorBuffer = initColorBuffer(gl, colors);
    const indexBuffer = initIndexBuffer(gl, indices);
    return {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer,
    };
}

// ============================= POSITION BUFFER ============================= //

function initPositionBuffer(gl, positions) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    return positionBuffer;
}

// ============================= COLOR BUFFER ============================= //

function initColorBuffer(gl, colors) {
    const clrBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, clrBuffer);
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    return clrBuffer;
}

// ============================= INDEX BUFFER ============================= //

function initIndexBuffer(gl, indices) {
    const idxBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    return idxBuffer;
}


export { initBuffers };