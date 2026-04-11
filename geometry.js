import { Color } from "./color.js";
import { drawScene } from "./draw-scene.js";
import { initBuffers } from "./init-buffers.js";

class Mesh {
    constructor(gl, geometry) {
        this.buffers = initBuffers(
            gl,
            geometry.positions,
            geometry.colors,
            geometry.indices,
            geometry.texcoords
        );
    }

    draw(gl, programInfo, ...args) {
        drawScene(gl, programInfo, this.buffers, ...args);
    }
}

class Material {
    /**
     * 
     * @param {{color: Color, texture: WebGLTexture}} param0 
     */
    constructor({ color = null, texture = null } = {}) {
        this.color = color;
        this.texture = texture;
    }

    apply(gl, programInfo) {
        if (this.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
        }

        if (this.color) {
            gl.uniform4fv(programInfo.uniformLocations.uColor, ...this.color.Float32);
        }
    }
}

class RenderObject {
    constructor(mesh, material) {
        this.mesh = mesh;
        this.material = material;
    }

    draw(gl, programInfo, ...args) {
        this.material.apply(gl, programInfo);
        this.mesh.draw(gl, programInfo, ...args);
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
    Mesh,
    RenderObject
}