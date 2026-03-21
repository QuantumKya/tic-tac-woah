import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";
import { loadShaderFiles, initShader, shaderSet } from "./shaders.js";
import { DrawnShape, Polygon, Quadrilateral } from "./shapez.js";
import { DIRECTIONS, unNoise } from "./math_stuff.js";
import { Color, COLORS } from "./color.js";
import { getCamMove, getMousePos } from "./input.js";
import Camera from "./camera.js";



// ================================ STUFF THAT CHANGES ================================ //
let cubeRotation = 0.0;
let cameraRho = 6.0;
let cameraTheta = 0;
let cameraPhi = Math.PI / 2;

shaderSet.default = await loadShaderFiles('vertex.glsl', 'fragment.glsl');
shaderSet.shaky = await loadShaderFiles('shaky.glsl', 'fragment.glsl');

const changeyStuff = {
    FRAMENUMBER: 0,
    shakeRandom: vec2.create(),
};

const currentShader = shaderSet.shaky;
main();



/**
 * @param {WebGLRenderingContext} gl The WebGL renderer.
 * @param {Camera} cam The camera.
 * @returns {Array<DrawnShape>}
 */
function makeShapes(gl, cam) {

    const cubeRadius = 10;
    const scaledX = vec3.scale(vec3.create(), DIRECTIONS.X, cubeRadius*2);
    const scaledY = vec3.scale(vec3.create(), DIRECTIONS.Y, cubeRadius*2);
    const scaledZ = vec3.scale(vec3.create(), DIRECTIONS.Z, cubeRadius*2);
    const scaledMX = vec3.scale(vec3.create(), DIRECTIONS.MX, cubeRadius*2);
    const scaledMY = vec3.scale(vec3.create(), DIRECTIONS.MY, cubeRadius*2);
    const scaledMZ = vec3.scale(vec3.create(), DIRECTIONS.MZ, cubeRadius*2);

    const halfXYZ = vec3.scale(vec3.create(), DIRECTIONS.XYZ, cubeRadius);
    const halfMXYZ = vec3.scale(vec3.create(), DIRECTIONS.XYZ, -cubeRadius);

    // Make cube
    const f1 = Quadrilateral.fromSides(halfMXYZ, scaledX, scaledY);
    const f2 = Quadrilateral.fromSides(halfMXYZ, scaledX, scaledZ);
    const f3 = Quadrilateral.fromSides(halfMXYZ, scaledY, scaledZ);
    const f4 = Quadrilateral.fromSides(halfXYZ, scaledMX, scaledMY);
    const f5 = Quadrilateral.fromSides(halfXYZ, scaledMX, scaledMZ);
    const f6 = Quadrilateral.fromSides(halfXYZ, scaledMY, scaledMZ);
    f1.setColor(COLORS.RED);
    f2.setColor(COLORS.BLUE);
    f3.setColor(COLORS.GREEN);
    f4.setColor(COLORS.YELLOW);
    f5.setColor(COLORS.CYAN);
    f6.setColor(COLORS.MAGENTA);
    const faces = [f1,f2,f3,f4,f5,f6];


    
    
    const radius = 3;
    const numOfRegions = 12;
    const per = 4;

    const rows = 4;
    const rowrad = radius/(rows+1);

    const center = vec3.fromValues(0, -1, 0);
    
    for (let r = 1; r <= rows; r++) {
        const inrad = r*rowrad;
        const outrad = (r+1)*rowrad;

        for (let n = 0; n < numOfRegions; n++) {
            const verts = [];
            
            const fromRad = (rad, direction) => {
                for (let i = 0; i <= per; i++) {
                    const thetaIndex = (n + Math.max(0, -direction) + direction * i/per);
                    const angle = thetaIndex * 2*Math.PI / numOfRegions;
                    
                    const offset = vec3.fromValues(
                        rad*Math.cos(angle),
                        0,
                        -rad*Math.sin(angle),
                    );
                    const circlepoint = vec3.create();
                    vec3.add(circlepoint, center, offset);
                    verts.push(circlepoint);
                }
            }

            fromRad(inrad, 1);
            fromRad(outrad, -1);
            
            const poly = Polygon.fromPoints(...verts);
            faces.push(poly);
        }
    }
    

    
    const color1 = Color.lerpColors(COLORS.BROWN, COLORS.WHITE, 1/3);
    const color2 = COLORS.BROWN;

    // hover highlight
    for (let i = 6; i < faces.length; i++) {
        const f = faces[i];

        const mP = getMousePos();
        const { origin: rayOrigin, dir: rayDir } = cam.getRaycastFromMouse(mP);

        const résultat = f.constituentTriangles.some(tri => tri.doesRayIntersect(rayOrigin, rayDir));

        const newColor1 = résultat ? COLORS.WHITE : color1;
        const newColor2 = résultat ? COLORS.WHITE : color2;

        const r = Math.floor((i-6) / 12);
        f.setColor((i%12+r)%2 ? newColor1 : newColor2);
    }



    return faces;
}


/**
 * @param {WebGLRenderingContext} gl The WebGL rendering context.
 * @param {object} programInfo
 * @param {Camera} camera The camera.
 */
function draw(gl, programInfo, camera) {
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);



    // ================================ CAMERA CHANGES ================================ //

    const moveCommand = getCamMove();

    cameraTheta += moveCommand[0] * 0.01;
    cameraTheta %= (2 * Math.PI);

    cameraPhi += moveCommand[1] * 0.01;
    cameraPhi = Math.max(cameraPhi, 1e-4);
    cameraPhi = Math.min(cameraPhi, Math.PI - 1e-4);

    cameraRho -= moveCommand[2] * 0.05;
    cameraRho = Math.max(0.75, cameraRho);
    
    

    let camX = cameraRho * Math.sin(cameraPhi) * Math.cos(cameraTheta);
    let camY = cameraRho * Math.cos(cameraPhi);
    let camZ = cameraRho * Math.sin(cameraPhi) * Math.sin(cameraTheta);

    [camX, camY, camZ] = unNoise(camX, camY, camZ);

    console.log(camX, camY, camZ);
    camera.setPosition(camX, camY, camZ);
    camera.setTargetPosition(vec3.fromValues(0,0,0));

    // ================================ CHANGE THAT MATRIX ================================ //

    camera.setMatrixFn((mat) => {
        return mat;
    });

    // ================================ PROCESS SHAPES ================================ //
    
    const faces = makeShapes(gl, camera);

    const positions = [];
    const colors = [];
    const indices = [];
    let vertexOffset = 0;

    for (const f of faces) {
        positions.push(...f.getVertexBuffer());
        colors.push(...f.getColorBuffer());
        indices.push(...f.getIndexBuffer().map(i => i + vertexOffset));
        vertexOffset += f.vertices.length;
    }
    

    // ================================ DRAW & LOOP ================================ //

    programInfo.camera = camera;
    
    const buffers = initBuffers(gl, positions, colors, indices);
    drawScene(gl, programInfo, buffers, changeyStuff);

    requestAnimationFrame(() => draw(gl, programInfo, camera));

    cubeRotation += 0.01;
    changeyStuff.FRAMENUMBER++;

    if (changeyStuff.FRAMENUMBER % 20 === 0) {
        vec2.set(changeyStuff.shakeRandom,
            Math.random()*0.2,
            Math.random()*0.2
        );
    }
}

function main() {
    const canvas = document.querySelector('canvas');
    // Initialize the GL context
    const gl = canvas.getContext('webgl');

    // Only continue if WebGL is available and working
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }



    const vsSource = currentShader.vsSource;
    const fsSource = currentShader.fsSource;
    const shaderProgram = initShader(gl, vsSource, fsSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
            vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
        },
    }

    // ================================ CAMERA CAMERA CAMERA ================================ //

    let fieldOfView = (45 * Math.PI) / 180; // in radians
    let zNear = 0.1;
    let zFar = 100.0;
    const camera = new Camera(
        gl,
        fieldOfView,
        zNear,
        zFar
    );

    draw(gl, programInfo, camera);
}