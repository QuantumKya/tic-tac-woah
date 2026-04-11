precision mediump float;

varying lowp vec4 vColor;
varying highp vec2 vTexCoord;

uniform sampler2D u_texture;

void main() {
    gl_FragColor = texture2D(u_texture, vTexCoord) * vColor;
}