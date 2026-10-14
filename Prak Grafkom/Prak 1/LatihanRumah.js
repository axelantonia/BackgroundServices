function main() {
    // canvas
    var CANVAS = document.getElementById("mycanvas");
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    // inisialisasi GL
    const GL = CANVAS.getContext("webgl", { antialias: true });

    if (!GL) {
        alert("WebGL context cannot be initialized");
        return false;
    }

    /* ========================= SHADERS ========================= */
    var shader_vertex_source = `
        attribute vec2 position;
        

        void main(void) {
            gl_PointSize = 10.0;
            gl_Position = vec4(position, 0., 1.); // (x,y,z,w) w = untuk perspektif (1 = benda dekat/jauh, besarnya sama dari kamera)
        }`;

    var shader_fragment_source = `
        precision mediump float;
        uniform vec3 uColor; // 1 color, vector 3D: r,g,b
        void main(void) {
            gl_FragColor = vec4(uColor, 1.); // r,g,b,a
        }`;

    var compile_shader = function (source, type, typeString) {
        var shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            alert("ERROR IN " + typeString + " SHADER: " + GL.getShaderInfoLog(shader));
            return false;
        }
        return shader;
    };


    // Shader Program 
    var shader_vertex = compile_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
    var shader_fragment = compile_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

    var SHADER_PROGRAM = GL.createProgram();
    GL.attachShader(SHADER_PROGRAM, shader_vertex);
    GL.attachShader(SHADER_PROGRAM, shader_fragment);
    GL.linkProgram(SHADER_PROGRAM);

    var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");
    GL.enableVertexAttribArray(_position);
    GL.useProgram(SHADER_PROGRAM);

    var uniform_color = GL.getUniformLocation(SHADER_PROGRAM, "uColor");

    /*======================== THE SHAPES ======================== */
    // Persegi panjang (2 segitiga)
    var triangle_vertex = [
        -0.5, -0.8, // 0: kiri bawah
        0.5, -0.8,  // 1: kanan bawah
        0.5, 0.2,   // 2: kanan atas
        -0.5, 0.2   // 3: kiri atas
    ];
    var triangle_faces = [
        0, 1, 2, // Segitiga 1
        0, 2, 3  // Segitiga 2
    ];

    // segitiga di atas persegi panjang
    var roof_vertex = [
        -0.6, 0.2,  // 0: kiri bawah atap
         0.6, 0.2,  // 1: kanan bawah atap
         0.0, 0.8   // 2: puncak atap
    ];
    var roof_faces = [0, 1, 2];

    var TRIANGLE_VERTEX = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, TRIANGLE_VERTEX);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(triangle_vertex), GL.STATIC_DRAW);

    var TRIANGLE_FACES = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, TRIANGLE_FACES);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangle_faces), GL.STATIC_DRAW);

    var ROOF_VERTEX = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, ROOF_VERTEX);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(roof_vertex), GL.STATIC_DRAW);

    var ROOF_FACES = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, ROOF_FACES);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(roof_faces), GL.STATIC_DRAW);

    /*========================= RENDERING ========================= */
    GL.clearColor(0.0, 0.5, 0.5, 1.0);
    var animate = function () {
        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT);

        // Gambar persegi panjang (kuning)
        GL.bindBuffer(GL.ARRAY_BUFFER, TRIANGLE_VERTEX);
        GL.vertexAttribPointer(_position, 2, GL.FLOAT, false, 4 * 2, 0);
        GL.uniform3f(uniform_color, 1, 1, 0);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, TRIANGLE_FACES);
        GL.drawElements(GL.TRIANGLES, triangle_faces.length, GL.UNSIGNED_SHORT, 0);

        // Gambar atap (merah)
        GL.bindBuffer(GL.ARRAY_BUFFER, ROOF_VERTEX);
        GL.vertexAttribPointer(_position, 2, GL.FLOAT, false, 4 * 2, 0);
        GL.uniform3f(uniform_color, 0.8, 0.1, 0.1);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, ROOF_FACES);
        GL.drawElements(GL.TRIANGLES, roof_faces.length, GL.UNSIGNED_SHORT, 0);

        GL.flush();
        window.requestAnimationFrame(animate);
    };
    animate();
    /*========================= DRAWING ========================= */

}
window.addEventListener('load', main);