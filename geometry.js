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
        this.texture = texture ?? TEXTURES.MISSING;
    }

    apply(gl, programInfo) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

        gl.uniform4fv(programInfo.uniformLocations.uColor, this.color.Float32);
    }
}

class RenderObject {
    /** @param {Geometry} geom @param {Material} material  */
    constructor(geom, material) {
        this.geom = geom;
        this.material = material;
    }

    init(gl) {
        this.geom.makeBuffers(gl);
    }

    draw(gl, programInfo, ...args) {
        this.material.apply(gl, programInfo);
        this.geom.draw(gl, programInfo, ...args);
    }

    setMaterial(material) { this.material = material; }
    setGeometry(geom) { this.geometry = geom; }

    setMaterialColor(color) {
        const newMat = new Material({
            color: color,
            texture: this.material.texture
        });
        this.setMaterial(newMat);
    }
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

    makeBuffers(gl) {
        this.buffers = initBuffers(
            gl,
            this.positions,
            this.colors,
            this.indices,
            this.texcoords
        );
    }

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