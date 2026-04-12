precision mediump float;

varying lowp vec4 vColor;
varying highp vec2 vTexCoord;

uniform sampler2D u_texture;
uniform lowp vec4 u_color;

void main() {
    vec4 tex = texture2D(u_texture, vTexCoord);

    // material color overrides vertex color
    if (u_color.r >= 0.0) {
        gl_FragColor = vec4(tex.rgb * u_color.rgb, tex.a);
    }
    else {
        gl_FragColor = vec4(tex.rgb * vColor.rgb, tex.a);
    }
}