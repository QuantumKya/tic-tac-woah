/**
 * @param {WebGLRenderingContext} gl 
 * @param {import("./draw.js").ProgramInfo} programInfo 
 * @param {import("./draw.js").BufferSet} buffers 
 * @param {boolean} isUI 
 */
function drawScene(gl, programInfo, buffers, isUI, changeyStuff) {
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    // time for the view matrix!!!

    const projectionMatrix = programInfo.camera.projectionMatrix;
    const viewMatrix = programInfo.camera.viewMatrix;

    // Set the drawing position to that provided by the camera,
    // which is translated by the camera's "position"
    // and other necessary transformations.
    const modelViewMatrix = mat4.clone(viewMatrix);

    

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    setPositionAttribute(gl, buffers, programInfo);
    setColorAttribute(gl, buffers, programInfo);
    setTextureAttribute(gl, buffers, programInfo);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);

    // Set the shader uniforms
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix,
    );
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix,
    );

    // ui check supplier
    gl.uniform1i(
        programInfo.uniformLocations.uiFlag, Number(isUI)
    );

    gl.uniform2f(
        gl.getUniformLocation(programInfo.program, "uRandomAddend"),
        ...changeyStuff.shakeRandom
    );

    // texture should be bound by materials earlier.
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    {
        const offset = 0;
        const type = gl.UNSIGNED_SHORT;
        gl.drawElements(gl.TRIANGLES, buffers.indexCount, type, offset);
    }
}


/**
 * @param {WebGLRenderingContext} gl 
 * @param {import("./draw.js").BufferSet} buffers 
 * @param {import("./draw.js").ProgramInfo} programInfo 
 */
function setPositionAttribute(gl, buffers, programInfo) {
    const numComponents = 3; // pull out 3 values per iteration
    const type = gl.FLOAT; // the data in the buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

/**
 * @param {WebGLRenderingContext} gl 
 * @param {import("./draw.js").BufferSet} buffers 
 * @param {import("./draw.js").ProgramInfo} programInfo 
 */
function setColorAttribute(gl, buffers, programInfo) {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
}

/**
 * @param {WebGLRenderingContext} gl 
 * @param {import("./draw.js").BufferSet} buffers 
 * @param {import("./draw.js").ProgramInfo} programInfo 
 */
function setTextureAttribute(gl, buffers, programInfo) {
    const num = 2; // every coordinate composed of 2 values
    const type = gl.FLOAT; // the data in the buffer is 32-bit float
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set to the next
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textures);
    gl.vertexAttribPointer(
        programInfo.attribLocations.textureCoord,
        num,
        type,
        normalize,
        stride,
        offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
}

export { drawScene };