import Camera from "./camera.js";
import { COLORS } from "./color.js";
import { Geometry, Material, RenderObject } from "./geometry.js";
import { DIRECTIONS } from "./math_stuff.js";
import { PolygonGroup, Quadrilateral } from "./shapez.js";
import { TEXTURES } from "./textures.js";

class UI {
    /** @param {Camera} camera  */
    constructor(camera) {
        this.updateWorld(camera);
    }
    
    /** @param {Camera} cam */
    updateWorld(cam) {
        const vm = cam.viewMatrix;
        const invVM = mat4.create(); mat4.invert(invVM, vm);
        
        const forward = vec4.fromValues(0, 0, 1, 1);
        vec4.transform(forward, forward, invVM);

        this.forwardDir = forward;
    }
}

class Panel {
    constructor(posx, posy, w, h) {
        this.pos = vec2.create();
        this.dim = vec2.create();

        this.setPosition(posx, posy);
        this.setSize(w, h);

        this.active = false;
        this.color = COLORS.WHITE;

        this.childUI = [];
    }

    open() { this.active = true; }
    close() { this.active = false; }

    setPosition(x, y) { vec2.set(this.pos, x, y); }
    setSize(w, h) {
        vec2.set(this.dim, w, h);

        const rect = Quadrilateral.fromSides(
            vec3.fromValues(0, 0, 0),
            DIRECTIONS.X, DIRECTIONS.Y
        );
        
        rect.changeVertices(v => {
            vec3.multiply(v, v, vec3.fromValues(...this.dim, 1));
            vec3.add(v, v, vec3.fromValues(...this.pos, 0));
        });

        this.poly = rect;
    }

    setColor(clr) { this.color = clr; }

    /** @returns {Material} */
    getMaterial() { return new Material({ color: this.color, texture: TEXTURES.BLANK }); }

    /** @returns {RenderObject} */
    getRenderer() {
        const geoms = [this.poly, ...this.childUI.map(a=>a.poly)].map(Geometry.fromPolygon);
        
        const mat = this.getMaterial();
        return new RenderObject(
            Geometry.combineGeometries(...geoms),
            mat
        );
    }
}

class TextUI extends Panel {
    constructor(posx, posy, message = '', fontSize = 0.01) {
        super(posx, posy, fontSize * message.length, fontSize);

        this.fontSize = fontSize;
        this.setMessage(message);
    }

    /** @param {number} size */
    setFontSize(size) { this.fontSize = size; }

    /** @param {string} msg */
    setMessage(msg) {
        const sqs = [];
        [...msg].forEach((c, i) => {
            const sq = Quadrilateral.fromSides(
                vec3.fromValues(i, 0, 0),
                DIRECTIONS.X, DIRECTIONS.Y
            );
            
            const charUV = getLetterUV(c);
            sq.setTextureBuffer(charUV);
            sqs.push(sq);
        });

        const textgroup = new PolygonGroup(...sqs);
        textgroup.changeVertices(v => {
            vec3.scaleAndAdd(v, vec3.fromValues(...this.pos, 0), v, this.fontSize);
        });
        this.poly = textgroup;

        vec2.set(this.dim, this.fontSize * msg.length, this.fontSize);
    }

    /** @returns {Material} */
    getMaterial() { return new Material({ texture: TEXTURES.ALPHABET }); }
}

class Button extends TextUI {
    /**
     * Creates a Button.
     * 
     * A Button object, in the context of other UI classes, encapsulates the text displayed on the button.
     * The colored panel behind said text is treated as the Button object's primary child object.
     * @param {number} posx The X coordinate of the button's top-left corner.
     * @param {number} posy The Y coordinate of the button's top-left corner.
     * @param {number} w The width of the button.
     * @param {number} h The height of the button.
     * @param {string} message The text to display on the button's face.
     * @param {(() => void)} action A function for the button to execute upon clicking it.
     * @param {number} [pad=0.01] The distance between the text of the button and its edge.
     */
    constructor(posx, posy, w, h, message, action, pad = 0.01) {
        const inW = w - 2*pad, inH = h - 2*pad;
        const wFontSize = inW/message.length;
        const fontSize = Math.min(wFontSize, inH);
        super(posx + pad, posy + pad, message, fontSize);
        
        this.action = action;

        const backPanel = new Panel(...this.pos, w, h);
        backPanel.poly.changeVertices(v => v[2] -= 0.01);
        backPanel.setColor(COLORS.WHITE);
        this.childUI.push(backPanel);
    }

    /** @param {string} msg  */
    setMessage(msg) {
        super.setMessage(msg);
    }
}



const alphabetUpper = Array.from({length: 26}, (_, i) => String.fromCharCode(i + 65));
const alphabetLower = Array.from({length: 26}, (_, i) => String.fromCharCode(i + 97));
const numerals = Array.from({length: 10}, (_, i) => String.fromCharCode(i + 48));
const letters = [...alphabetUpper, ...alphabetLower, ...numerals, ...'.,:;?!', ...'@#$%&*'];


function getLetterUV(letter) {
    const letterIndex = letters.indexOf(letter);
    if (letterIndex === -1) return;

    const u0 = letterIndex/letters.length;
    const u1 = (letterIndex+1)/letters.length;

    return [
        // remember, tex coordinates are for some reason (0,0) = B-L
        u0, 1, // top-left
        u1, 1, // top-right
        u1, 0, // bottom-right
        u0, 0, // bottom-left
    ];
}

export {
    Panel,
    Button,
    TextUI,
}