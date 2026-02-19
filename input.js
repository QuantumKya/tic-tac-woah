const canvas = document.querySelector('canvas');

const mousePos = vec2.create();
const getMousePos = () => mousePos;



const takeMouse = e => {
    const rect = e.target.getBoundingClientRect();

    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    vec2.set(mousePos, mx, my);
}

canvas.addEventListener('mousemove', takeMouse);
canvas.addEventListener('mousedown', takeMouse);
canvas.addEventListener('mouseup', takeMouse);


export { getMousePos };