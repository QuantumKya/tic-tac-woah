const canvas = document.querySelector('canvas');
const cWidth = canvas.width;
const cHeight = canvas.height;

class InputManager {
    constructor() {
        this.keysDown = {
            'KeyW': false,
            'KeyA': false,
            'KeyS': false,
            'KeyD': false,
            'KeyQ': false,
            'KeyE': false,
        };
        
        this.mousePos = vec2.create();
        this.lastMouse = vec2.create();
        this.scrollDelta = 0;

        this.leftMousing = false;
        this.leftMoused = false;
        this.rightMousing = false;
        this.rightMoused = false;

        this.initListeners();
    }

    initListeners() {
        canvas.addEventListener('mousemove', e => this.takeMouse(e));
        canvas.addEventListener('mousedown', e => this.takeMouse(e));
        canvas.addEventListener('mouseup', e => this.takeMouse(e));
        canvas.addEventListener('contextmenu', e => e.preventDefault());

        document.addEventListener('keydown', e => this.getKeyInputs(e));
        document.addEventListener('keyup', e => this.getKeyInputs(e));
        document.addEventListener('wheel', e => {
            this.scrollDelta = e.deltaY;
        });
    }

    tick() {
        this.leftMoused = false;
        this.rightMoused = false;
    }

    getMousePos() {
        const mouseCopy = vec2.create();
        vec2.copy(mouseCopy, this.mousePos);
        return mouseCopy;
    }

    getMouseInfo() {
        return {
            spontaneous: [this.leftMoused, this.rightMoused],
            held: [this.leftMousing, this.rightMousing]
        };
    }

    getCamMove() {
        const mouseElapsed = vec2.create();
        vec2.subtract(mouseElapsed, this.getMousePos(), this.lastMouse);

        const scrl = this.scrollDelta;

        this.lastMouse = this.getMousePos();
        this.scrollDelta = 0;

        return [
            Number(this.keysDown.KeyD) - Number(this.keysDown.KeyA) + mouseElapsed[0] * Number(this.rightMousing) * 0.5,
            Number(this.keysDown.KeyW) - Number(this.keysDown.KeyS) + -mouseElapsed[1] * Number(this.rightMousing) * 0.5,
            Number(this.keysDown.KeyE) - Number(this.keysDown.KeyQ) + scrl * 0.05
        ];
    }

    /** @param {MouseEvent} e */
    takeMouse(e) {
        if (e.button === 0) {
            if (e.type === 'mousedown') {
                this.leftMousing = true;
                this.leftMoused = true;
            }
            else if (e.type === 'mouseup') {
                this.leftMousing = false;
            }
        }
        else if (e.button === 2) {
            e.preventDefault();
            if (e.type === 'mousedown') {
                this.rightMousing = true;
                this.rightMoused = true;
                canvas.style.cursor = 'none';
            }
            else if (e.type === 'mouseup') {
                this.rightMousing = false;
                canvas.style.cursor = 'default';
            }
        }
        
        const rect = e.target.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        vec2.set(this.mousePos, mx, my);
    }

    /** @param {KeyboardEvent} e */
    getKeyInputs(e) {
        let b = null;
        if (e.type === 'keydown') b = true;
        else if (e.type === 'keyup') b = false;
        else return;

        Object.keys(this.keysDown).forEach(k => { if (e.code === k) this.keysDown[k] = b; });
    }
}

const inputStuff = new InputManager();

export { inputStuff, cWidth, cHeight };