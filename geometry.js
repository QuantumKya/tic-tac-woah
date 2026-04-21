import { Color, COLORS } from "./color.js";
import { drawScene } from "./draw-scene.js";
import { initBuffers } from "./init-buffers.js";
import { TEXTURES } from "./textures.js";

class Material {
    /**
     * @param {{color: Color, texture: WebGLTexture}} param0 
     */
    constructor({ color = null, texture = null } = {}) {
        this.color = color ?? COLORS.NONE;
        this.texture = texture ?? TEXTURES.BLANK;
    }

    apply(gl, programInfo) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

        gl.uniform4fv(programInfo.uniformLocations.uColor, this.color.Float32);
    }

    static get NONE() {
        return new Material({
            color: COLORS.NONE,
            texture: TEXTURES.BLANK
        });
    }
}

class RenderObject {
    /** @param {Geometry} geom @param {Material} material  */
    constructor(geom, material) {
        this.geom = geom;
        this.material = material;
    }

    /** @param {WebGLRenderingContext} gl */
    init(gl) {
        this.geom.makeBuffers(gl);
    }

    /** @param {WebGLRenderingContext} gl @param {import("./draw.js").ProgramInfo} programInfo @param {...*} args  */
    draw(gl, programInfo, ...args) {
        this.material.apply(gl, programInfo);
        this.geom.draw(gl, programInfo, ...args);
    }

    /** @param {Material} material */
    setMaterial(material) { this.material = material; }
    /** @param {Geometry} geom */
    setGeometry(geom) { this.geometry = geom; }

    /**
     * Set the material's color to use.
     * Will override the color of any geometry this material applies to.
     * Use COLORS.NONE to keep the geometry's color unchanged.
     * @param {Color} color 
     */
    setMaterialColor(color) {
        const newMat = new Material({
            color: color,
            texture: this.material.texture
        });
        this.setMaterial(newMat);
    }
    
    /**
     * Set the material's texture to use.
     * Use TEXTURES.BLANK when using only color.
     * @param {WebGLTexture} text
     */
    setMaterialTexture(text) {
        const newMat = new Material({
            color: this.material.color,
            texture: text
        });
        this.setMaterial(newMat);
    }
}

class Geometry {
    /**
     * @param {Float32Array} positions 
     * @param {Uint16Array} indices 
     * @param {Float32Array} colors 
     * @param {Float32Array} texcoords 
     */
    constructor(positions, indices, colors = null, texcoords = null) {
        this.positions = positions;
        this.indices = indices;
        this.colors = colors;
        this.texcoords = texcoords;
    }
    
    /**
     * Get a geometry object directly from a Polygon. Extracts buffers from the given Polygon using built-in Polygon functions.
     * @param {DrawnShape} poly The Polygon from which to take buffer data.
     * @returns {Geometry} The constructed Geometry.
     */
    static fromPolygon(poly) {
        return new Geometry(
            new Float32Array(poly.getVertices()),
            new Uint16Array(poly.getIndexBuffer()),
            new Float32Array(poly.getColors()),
            new Float32Array(poly.getTextureBuffer())
        );
    }

    /** @param {WebGLRenderingContext} gl */
    makeBuffers(gl) {
        this.buffers = initBuffers(
            gl,
            this.positions,
            this.colors,
            this.indices,
            this.texcoords
        );
    }

    /** @param {WebGLRenderingContext} gl @param {import("./draw.js").ProgramInfo} programInfo @param {...*} args  */
    draw(gl, programInfo, ...args) {
        drawScene(gl, programInfo, this.buffers, ...args);
    }

    /** @param {...Geometry} geoms  */
    static combineGeometries(...geoms) {
        const positions = [];
        const colors = [];
        const indices = [];
        const texcoords = [];
        let vertexOffset = 0;
        for (const g of geoms) {
            for (const i of g.indices) indices.push(i+vertexOffset);

            positions.push(...g.positions);
            colors.push(...g.colors);
            texcoords.push(...(g.texcoords ?? new Float32Array((g.positions.length/3)*2)));

            vertexOffset += g.positions.length / 3;
        }

        console.log(
            positions.length/3,
            colors.length/4,
            texcoords.length/2
        );

        return new Geometry(
            new Float32Array(positions),
            new Uint16Array(indices),
            new Float32Array(colors),
            new Float32Array(texcoords)
        );
    }
}

export {
    Geometry,
    Material,
    RenderObject
}