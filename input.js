const canvas = document.querySelector('canvas');

const mousePos = vec2.create();
const getMousePos = () => {
    const mouseCopy = vec2.create();
    vec2.copy(mouseCopy, mousePos);
    return mouseCopy;
}

const keysDown = {
    'KeyW': false,
    'KeyA': false,
    'KeyS': false,
    'KeyD': false,
    'KeyQ': false,
    'KeyE': false,
};
let lastMouse = vec2.create();
let rightMousing = false;
let scrollDelta = 0;


const getCamMove = () => {
    const mouseElapsed = vec2.create();
    vec2.subtract(mouseElapsed, getMousePos(), lastMouse);
    console.log(mouseElapsed, rightMousing);

    const out = [
        Number(keysDown.KeyD) - Number(keysDown.KeyA) + mouseElapsed[0] * Number(rightMousing) * 0.5,
        Number(keysDown.KeyW) - Number(keysDown.KeyS) + mouseElapsed[1] * Number(rightMousing) * 0.5,
        Number(keysDown.KeyE) - Number(keysDown.KeyQ) + scrollDelta * 0.01
    ];

    scrollDelta = 0;
    return out;
};



/** @param {MouseEvent} e */
const takeMouse = e => {
    lastMouse = getMousePos();

    if (e.button === 2) {
        e.preventDefault();
        if (e.type === 'mousedown') {
            rightMousing = true;
            canvas.style.cursor = 'none';
        }
        else if (e.type === 'mouseup') {
            rightMousing = false;
            canvas.style.cursor = 'default';
        }
    }
    
    const rect = e.target.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    vec2.set(mousePos, mx, my);
};

/** @param {KeyboardEvent} e */
const getKeyInputs = e => {
    let b = null;
    if (e.type === 'keydown') b = true;
    else if (e.type === 'keyup') b = false;
    else return;

    Object.keys(keysDown).forEach(k => { if (e.code === k) keysDown[k] = b; });
};

canvas.addEventListener('mousemove', takeMouse);
canvas.addEventListener('mousedown', takeMouse);
canvas.addEventListener('mouseup', takeMouse);
canvas.addEventListener('contextmenu', e => e.preventDefault());

document.addEventListener('keydown', getKeyInputs);
document.addEventListener('keyup', getKeyInputs);
document.addEventListener('wheel', e => {
    scrollDelta = e.deltaY;
});


export { getMousePos, getCamMove };