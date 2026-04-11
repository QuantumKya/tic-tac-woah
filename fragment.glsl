precision mediump float;

varying lowp vec4 vColor;
varying highp vec2 vTexCoord;

uniform sampler2D u_texture;
uniform lowp vec4 u_color;

void main() {
    vec4 tex = texture2D(u_texture, vTexCoord);
    vec4 tint = u_color * vColor;
    gl_FragColor = vec4(tex.rgb * tint.rgb, tex.a);
}