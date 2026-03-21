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
    const float a = 0.01; // 0.01 for cool style, 0.025 for kinda shaky, 0.05 for SHAKY

    gl_Position = aVertexPosition + vec4(
        (random(aVertexPosition.xy + uRandomAddend + vec2(0,0)) - 0.5) * a,
        (random(aVertexPosition.yz + uRandomAddend + vec2(0,1)) - 0.5) * a,
        (random(aVertexPosition.xz + uRandomAddend + vec2(0,2)) - 0.5) * a,
        0
    );
    gl_Position = uProjectionMatrix * uModelViewMatrix * gl_Position;
    vColor = aVertexColor;
}