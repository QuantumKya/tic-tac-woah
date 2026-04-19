import { loadShaderFiles, initShader, shaderSet } from "./shaders.js";
import { Polygon, Quadrilateral } from "./shapez.js";
import { DIRECTIONS, unNoise } from "./math_stuff.js";
import { Color, COLORS } from "./color.js";
import { getCamMove } from "./input.js";
import Camera from "./camera.js";
import { loadBasicTextures, loadTexture, TEXTURES } from "./textures.js";
import { Geometry, Material, RenderObject } from "./geometry.js";
import { makeSphere } from "./shape_making.js";

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

    const cubeRadius = 7.5;
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
    const cubeFaces = [f1,f2,f3,f4,f5,f6];

    const cubeGeoms = cubeFaces.map(Geometry.fromPolygon);
    const cubeGeometry = Geometry.combineGeometries(...cubeGeoms);

    const cubeMaterial = new Material({
        color: COLORS.NONE,
        texture: TEXTURES.ITSFINALLYMINISHED
    });
    const cubeRender = new RenderObject(cubeGeometry, cubeMaterial);



    const wheelFaces = [];
    const wheelMaterial = Material.NONE;
    const wheelRenderers = [];
    
    const radius = 2;
    const numOfRegions = 8;
    const rows = 4;
    const per = 8;

    const center = vec3.fromValues(0, 0, 0);
    
    const brown1 = Color.lerpColors(COLORS.BROWN, COLORS.WHITE, 0.05);
    const brown2 = Color.lerpColors(COLORS.BROWN, COLORS.WHITE, 0.35);
    
    
    const rowrad = radius/(rows+1);
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



            const light = (r & 1) ^ (n & 1);
            
            const poly = Polygon.fromPoints(...verts);
            if (!poly) continue;
            poly.setColor(light ? brown1 : brown2);
            wheelFaces.push(poly);

            const geom = Geometry.fromPolygon(poly);
            wheelRenderers.push(new RenderObject(geom, wheelMaterial));
        }
    }



    cubeRender.init(gl);
    wheelRenderers.forEach(wr => wr.init(gl));

    shapes.cube = cubeFaces;
    renderers.cube = cubeRender;
    shapes.annulus = wheelFaces;
    renderers.annulus = wheelRenderers;


    const sphereStuff = makeSphere(
        vec3.fromValues(1,0,0),
        0.5,
        (t,p) => COLORS.RED,
        3,
        3
    );
    sphereStuff.renderers.forEach(sr => sr.init(gl));

    shapes.sphere = sphereStuff.shapes;
    renderers.sphere = sphereStuff.renderers;
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
    //for (const r of renderers.annulus) r.draw(gl, programInfo, changeyStuff);
    for (const r of renderers.xs) r.draw(gl, programInfo, changeyStuff);
    for (const r of renderers.os) r.draw(gl, programInfo, changeyStuff);

    for (const s of renderers.sphere) s.draw(gl, programInfo, changeyStuff);

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
    TEXTURES.ITSFINALLYMINISHED = loadTexture(gl, 'minish.png');

    // ================================ CHANGES TO SHAPES ================================ //

    document.addEventListener('mousemove', e => {
        for (let i = 0; i < shapes.annulus.length; i++) {
            const f = shapes.annulus[i];
            renderers.annulus[i].setMaterialColor(
                f.isHoveredUpon(camera) ? COLORS.WHITE : COLORS.NONE
            );
        }
        for (let i = 0; i < shapes.sphere.length; i++) {
            const f = shapes.sphere[i];
            renderers.sphere[i].setMaterialColor(
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