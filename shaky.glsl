attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

uniform vec2 uRandomAddend;

varying lowp vec4 vColor;

float random (vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    gl_Position = gl_Position + vec4(
        (random(aVertexPosition.xy + uRandomAddend + vec2(0,0)) - 0.5) * 0.12,
        (random(aVertexPosition.yz + uRandomAddend + vec2(0,1)) - 0.5) * 0.12,
        (random(aVertexPosition.xz + uRandomAddend + vec2(0,2)) - 0.5) * 0.12,
        0
    );
    vColor = aVertexColor;
}