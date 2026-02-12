function initBuffers(gl) {
    const positionBuffer = initPositionBuffer(gl);
    const colorBuffer = initColorBuffer(gl);
    return {
        position: positionBuffer,
        color: colorBuffer,
    };
}

function initPositionBuffer(gl) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
         1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
        -1.0, -1.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    return positionBuffer;
}

// ============================= COLORS ============================= //

function initColorBuffer(gl) {
    const colors = [
        1.0,
        1.0,
        1.0,
        1.0, // white
        1.0,
        0.0,
        0.0,
        1.0, // red
        0.0,
        1.0,
        0.0,
        1.0, // green
        0.0,
        0.0,
        1.0,
        1.0, // blue
    ];

    const clrBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, clrBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return clrBuffer;
}

export { initBuffers, initColorBuffer };