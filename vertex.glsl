attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec4 aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying lowp vec4 vColor;
varying highp vec2 vTexCoord;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vTexCoord = aTextureCoord;
    vColor = aVertexColor;
}