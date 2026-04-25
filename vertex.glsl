attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec4 aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

uniform bool uiFlag;

varying lowp vec4 vColor;
varying highp vec2 vTexCoord;

void main() {
    vec4 pos = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    if (uiFlag) pos = vec4(aVertexPosition.xyz, 1.0);

    // normal shader stuff
    gl_Position = pos;
    vTexCoord = aTextureCoord;
    vColor = aVertexColor;
}