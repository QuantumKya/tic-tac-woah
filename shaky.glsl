attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec4 aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

uniform bool uiFlag;

varying lowp vec4 vColor;
varying highp vec2 vTexCoord;

uniform vec2 uRandomAddend;

float random (vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    const float a = 0.02; // 0.01 for cool style, 0.025 for kinda shaky, 0.05 for SHAKY

    vec4 pos = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    if (uiFlag) pos = vec4(aVertexPosition.xyz, 1.0);

    pos.xy += vec2(
        random(pos.xy + uRandomAddend) - 0.5,
        random(pos.yx + uRandomAddend) - 0.5
    ) * a / (uiFlag ? 5.0 : 1.0);


    // normal shader stuff
    gl_Position = pos;
    vTexCoord = aTextureCoord;
    vColor = aVertexColor;
}