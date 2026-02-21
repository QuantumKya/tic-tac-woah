const canvas = document.querySelector('canvas');

const mousePos = vec2.create();
const getMousePos = () => mousePos;

const keysDown = {
    'KeyW': false,
    'KeyA': false,
    'KeyS': false,
    'KeyD': false,
};

const getCamMove = () => vec2.fromValues(
    Number(keysDown.KeyD) - Number(keysDown.KeyA),
    Number(keysDown.KeyW) - Number(keysDown.KeyS),
);




/** @param {MouseEvent} e */
const takeMouse = e => {
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

    Object.keys(keysDown).forEach(k => { if (e.key === k) keysDown[k] = b; });
};

canvas.addEventListener('mousemove', takeMouse);
canvas.addEventListener('mousedown', takeMouse);
canvas.addEventListener('mouseup', takeMouse);

document.addEventListener('keydown', getKeyInputs);
document.addEventListener('keyup', getKeyInputs);


export { getMousePos, getCamMove };