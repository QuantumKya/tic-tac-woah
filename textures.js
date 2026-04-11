import { COLORS } from "./color.js";

// ================================ I STOLE THIS WHOLE THING FROM THE MDN WEB DOCS TUTORIAL ============================= //
function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // This one pixel is so we can use the texture even before the image loads
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
    gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        width,
        height,
        border,
        srcFormat,
        srcType,
        pixel,
    );

    const image = new Image();
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            level,
            internalFormat,
            srcFormat,
            srcType,
            image,
        );

        // WebGL1 has different requirements for power of 2 images
        // vs. non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };
    image.src = url;

    return texture;
}

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}



const TEXTURES = {
    BLANK: null,
    MISSING: null,
};

/** @param {WebGLRenderingContext} gl */
function loadBasicTextures(gl) {

    TEXTURES.BLANK = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, TEXTURES.BLANK);
    
    // BLANK TEXTURE
    const level = 0;
    const pixel = new Uint8Array([255, 255, 255, 255]); // white
    gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        gl.RGBA,
        1, 1, // dimensions
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixel
    );

    TEXTURES.MISSING = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, TEXTURES.MISSING);

    const magentablack = new Uint8Array([
        ...COLORS.MAGENTA.rgbaInt, ...COLORS.BLACK.rgbaInt,
        ...COLORS.BLACK.rgbaInt, ...COLORS.MAGENTA.rgbaInt
    ]);
    gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        gl.RGBA,
        2, 2, // width
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        magentablack,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

export {
    loadTexture,
    loadBasicTextures,
    TEXTURES
}