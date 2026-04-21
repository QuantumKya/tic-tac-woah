import { loadShaderFiles, initShader, shaderSet } from "./shaders.js";
import { Polygon, Quadrilateral } from "./shapez.js";
import { DIRECTIONS, unNoise } from "./math_stuff.js";
import { Color, COLORS } from "./color.js";
import { getCamMove } from "./input.js";
import Camera from "./camera.js";
import { loadBasicTextures, loadTexture, TEXTURES } from "./textures.js";
import { Geometry, Material, RenderObject } from "./geometry.js";
import { makeAnnulus, makeCube, makeSphere } from "./shape_making.js";
import { Button, Panel, TextUI } from "./ui.js";

/** @typedef {{program: WebGLProgram, attribLocations: {vertexPosition: number, textureCoord: number, vertexColor: number}, uniformLocations: {projectionMatrix: number, modelViewMatrix: number, uSampler: number, uColor: number}}} ProgramInfo */
/** @typedef {{position: WebGLBuffer, color: WebGLBuffer, indices: WebGLBuffer, indexCount: number }} BufferSet */

// ================================ STUFF THAT CHANGES ================================ //
let cubeRotation = 0.0;
let cameraRho = 3.0;
let cameraTheta = 0;
let cameraPhi = Math.PI / 2;

shaderSet.default = await loadShaderFiles('vertex.glsl', 'fragment.glsl');
shaderSet.shaky = await loadShaderFiles('shaky.glsl', 'fragment.glsl');

const changeyStuff = {
    FRAMENUMBER: 0,
    shakeRandom: vec2.create(),
};

const currentShader = shaderSet.shaky;
const shapes = {
    xs: [], os: []
};
const renderers = {
    xs: [], os: []
};
main();



/** @param {WebGLRenderingContext} gl The WebGL renderer. */
function makeShapes(gl) {

    const brown1 = Color.lerpColors(COLORS.BROWN, COLORS.WHITE, 0.05);
    const brown2 = Color.lerpColors(COLORS.BROWN, COLORS.WHITE, 0.35);

    const annulusStuff = makeAnnulus(
        vec3.fromValues(0,0,0),
        2, 1, 4, 8,
        (r,s) => ((r & 1) ^ (s & 1)) ? brown1 : brown2
    );
    annulusStuff.renderers.forEach(wr => wr.init(gl));
    shapes.annulus = annulusStuff.shapes;
    renderers.annulus = annulusStuff.renderers;


    const sphereStuff = makeSphere(vec3.fromValues(0,0,0), 0.5, () => COLORS.RED);
    sphereStuff.renderers.forEach(sr => sr.init(gl));
    shapes.sphere = sphereStuff.shapes;
    renderers.sphere = sphereStuff.renderers;

    const cubeStuff = makeCube(
        vec3.fromValues(0,0,0),
        7.5,
        (i) => [COLORS.RED, COLORS.BLUE, COLORS.GREEN, COLORS.YELLOW, COLORS.CYAN, COLORS.MAGENTA][i]
    );
    cubeStuff.renderer.init(gl);
    cubeStuff.renderer.setMaterialTexture(TEXTURES.ITSFINALLYMINISHED);
    shapes.cube = cubeStuff.sides;
    renderers.cube = cubeStuff.renderer;



    const textShape = new TextUI(
        -3, 1,
        "ABCDEFG",
        1
    );
    shapes.texttest = textShape;
    const panelShape = new Panel(
        -3, 0, 7, 3
    );
    panelShape.poly.changeVertices(v => v[2] -= 0.01)
    shapes.paneltest = panelShape;
    const buttonShape = new Button(
        0, -2, 5, 1, 'hello', ()=>{}, 0.1
    );
    shapes.buttontest = buttonShape;
}


/**
 * @param {WebGLRenderingContext} gl The WebGL rendering context.
 * @param {object} programInfo
 * @param {Camera} camera The camera.
 */
function draw(gl, programInfo) {

    gl.useProgram(programInfo.program);
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);



    // ================================ CAMERA CHANGES ================================ //

    const camera = programInfo.camera;

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

    camera.setPosition(camX, camY, camZ);
    camera.setTargetPosition(vec3.fromValues(0,0,0));

    // ================================ CHANGE THAT MATRIX ================================ //

    camera.setMatrixFn((mat) => {
        return mat;
    });

    // ================================ DRAW & LOOP ================================ //
    
    renderers.cube.draw(gl, programInfo, changeyStuff);
    for (const r of renderers.annulus) r.draw(gl, programInfo, changeyStuff);
    for (const r of renderers.xs) r.draw(gl, programInfo, changeyStuff);
    for (const r of renderers.os) r.draw(gl, programInfo, changeyStuff);

    for (const s of renderers.sphere) s.draw(gl, programInfo, changeyStuff);
    
    const panelRenderer = shapes.paneltest.getRenderer();
    panelRenderer.init(gl);
    panelRenderer.draw(gl, programInfo, changeyStuff);
    const textRenderer = shapes.texttest.getRenderer();
    textRenderer.init(gl);
    textRenderer.draw(gl, programInfo, changeyStuff);
    const buttonRenderer = shapes.buttontest.getRenderer();
    buttonRenderer.init(gl);
    buttonRenderer.draw(gl, programInfo, changeyStuff);

    requestAnimationFrame(() => draw(gl, programInfo));

    // ================================ END-OF-LOOP CHANGES ================================ //

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
    console.log(vsSource, fsSource);
    const shaderProgram = initShader(gl, vsSource, fsSource);
    console.log(shaderProgram);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
            textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
            vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
            uSampler: gl.getUniformLocation(shaderProgram, "u_texture"),
            uColor: gl.getUniformLocation(shaderProgram, "u_color"),
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
    programInfo.camera = camera;
    
    // ================================ PREP ================================ //

    // load the textures
    loadBasicTextures(gl);

    TEXTURES.X = loadTexture(gl, 'x.png');
    TEXTURES.O = loadTexture(gl, 'o.png');
    TEXTURES.PH = loadTexture(gl, 'faceholder.png');
    TEXTURES.ALPHABET = loadTexture(gl, 'alphabet.png');
    TEXTURES.ITSFINALLYMINISHED = loadTexture(gl, 'minish.png');

    // ================================ CHANGES TO SHAPES ================================ //

    document.addEventListener('mousemove', e => {
        for (let i = 0; i < shapes.annulus.length; i++) {
            const f = shapes.annulus[i];
            renderers.annulus[i].setMaterialColor(
                f.isHoveredUpon(camera) ? COLORS.WHITE : COLORS.NONE
            );
        }
    });

    canvas.addEventListener('mousedown', e => {
        if (e.button !== 0) return;

        const anfaces = shapes.annulus;
        const anrenders = renderers.annulus;
        if (!anfaces || !anrenders) return;

        for (let i = 0; i < anfaces.length; i++) {
            const f = anfaces[i];
            if (!f.isHoveredUpon(camera)) continue;

            const xshape = f.getMatchingSquare();

            const norm = xshape.getPlane().normal;
            const offset = vec3.scale(vec3.create(), norm, -0.01);
            for (const p of xshape.vertices) vec3.add(p, p, offset); // make it a little higher up
            

            const xgeom = Geometry.fromPolygon(xshape);
            const xmaterial = new Material({
                texture: (e.shiftKey ? TEXTURES.O : TEXTURES.X),
                color: (e.shiftKey ? COLORS.BLUE : COLORS.RED)
            });
            const xrender = new RenderObject(xgeom, xmaterial);
            xrender.init(gl);

            shapes[e.shiftKey ? 'os' : 'xs'].push(xshape);
            renderers[e.shiftKey ? 'os' : 'xs'].push(xrender);

            return;
        }
    });



    makeShapes(gl, camera);

    draw(gl, programInfo);
}