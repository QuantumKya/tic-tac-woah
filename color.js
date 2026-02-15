import { avgArray, wAvgArray } from "./math_stuff.js";

class Color {
    constructor(r, g, b, a) {
        this.rgba = [r, g, b, a];
    }

    get r() { return this.rgba[0]; }
    get g() { return this.rgba[1]; }
    get b() { return this.rgba[2]; }
    get a() { return this.rgba[3]; }
    


    // ================================ COLOR MIXING ================================ //

    /**
     * Average the componenets of a set of colors. Does not mutate original colors.
     * @param  {...Color} colors A length-4 array of numbers between 0 and 1, encoding for RGBA values.
     * @returns {Color} the final, mixed color.
     */
    static mixColors(...colors) {
        return new Color(
            avgArray(colors.map(clr => clr.r)),
            avgArray(colors.map(clr => clr.g)),
            avgArray(colors.map(clr => clr.b)),
            avgArray(colors.map(clr => clr.a))
        );
    }
    // larpColors hahahahahahahahahahahahaha
    /**
     * Interpolate two colors by some amount t. Does not mutate original colors.
     * @param {Color} c1 A length-4 array of numbers between 0 and 1, encoding for RGBA values.
     * @param {Color} c2 A length-4 array of numbers between 0 and 1, encoding for RGBA values.
     * @param {number} t Between 0 and 1, where lower t-values favor c1 and higher favor c2.
     * @returns {Color} The final, mixed color.
     */
    static lerpColors(c1, c2, t) {
        const lerpArr = [t, 1-t];
        return new Color(
            wAvgArray([c1.r, c2.r], lerpArr),
            wAvgArray([c1.g, c2.g], lerpArr),
            wAvgArray([c1.b, c2.b], lerpArr),
            wAvgArray([c1.a, c2.a], lerpArr)
        );
    }



    // ================================ OPACITY FUNCTIONS ================================ //

    // param is from 0 to 1
    /**
     * Scale a color's opacity. Does not mutate original colors.
     * @param {Color} clr A length-4 array of numbers between 0 and 1, encoding for RGBA values.
     * @param {number} a The opacity to apply.
     * @returns {Color} The color with opacity applied.
     */
    static applyOpacity(clr, a) {
        return new Color(clr.r, clr.g, clr.b, Math.min(1, clr.a * a));
    }
    
    /**
     * Set a color's opacity to a certain value. Does not mutate original colors.
     * @param {Color} clr A length-4 array of numbers between 0 and 1, encoding for RGBA values.
     * @param {number} a The opacity to apply, between 0 and 1.
     * @returns {Color} The color with changed opacity.
    */
    static setOpacity(clr, a) {
       return new Color(clr.r, clr.g, clr.b, clr.g, a);
    }
    

    
    // ================================ INSTANCE FUNCTIONS ================================ //

    /** @see Color.lerpColors */
    lerpColors(c2, t) { return Color.lerpColors(this, c2, t); }
    /** @see Color.applyOpacity */
    applyOpacity(a) { return Color.setOpacity(this, a) }
    /** @see Color.setOpacity */
    setOpacity(a) { return Color.setOpacity(this, a) };
}

const COLOR_ARRAYS = {
    WHITE: [1.0, 1.0, 1.0, 1.0],
    GRAY: [0.5, 0.5, 0.5, 1.0],
    BLACK: [0.0, 0.0, 0.0, 0.0],

    RED: [1.0, 0.0, 0.0, 1.0],
    GREEN: [0.0, 1.0, 0.0, 1.0],
    BLUE: [0.0, 0.0, 1.0, 1.0],

    YELLOW: [1.0, 1.0, 0.0, 1.0],
    CYAN: [0.0, 1.0, 1.0, 1.0],
    MAGENTA: [1.0, 0.0, 1.0, 1.0],

    ORANGE: [1.0, 0.5, 0.0, 1.0],
    PINK: [1.0, 0.5, 0.5, 1.0],
    BROWN: [0.5, 0.25, 0.0, 1.0],
}
const COLORS = Object.fromEntries(
    Object.entries(COLOR_ARRAYS).map(
        ([ k, rgba ]) => ([ k, new Color(...rgba) ])
    )
);



// params are from 0 to 255
/**
 * All inputs are between 0 and 255
 * @param {number} r 
 * @param {number} g 
 * @param {number} b 
 * @param {number} a 
 * @returns {Color} the section of a color buffer corresponding with RGBA input; intended for passing into getColorBuffer function
 */
function getColor(r, g, b, a = 255) {
    return new Color(
        r/255,
        g/255,
        b/255,
        a/255
    );
}


/**
 * Concatenate a set of colors into a color buffer array.
 * @param  {...Color} colors A length-4 array of numbers between 0 and 1, encoding for RGBA values.
 * @returns {Array<number>} An array of numbers; each subset of 4 entries codes, in RGBA, for a color.
 */
function getColorBuffer(...colors) {
    return colors.map(c => c.rgba).flat();
}



export {
    getColor,
    getColorBuffer,
    Color,
    COLORS,
};