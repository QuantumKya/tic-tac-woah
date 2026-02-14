import { Color, COLORS, getColor, getColorBuffer } from './color.js';

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
    const period = 1000 / 0.25; // 1000 / frequency
    const t = Math.pow(Math.sin((Date.now() % period) / period * 2 * Math.PI), 2);
    const larpColor = Color.lerpColors(COLORS.RED, COLORS.BLUE, t);
    const colors = getColorBuffer(
        larpColor,
        larpColor,
        larpColor,
        larpColor,
    );

    const clrBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, clrBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return clrBuffer;
}

export { initBuffers };