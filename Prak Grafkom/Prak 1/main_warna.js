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
        attribute vec3 color;
        varying vec3 vColor;

        void main(void) {
            gl_Position = vec4(position, 0., 1.);
            vColor = color;
        }`;

    var shader_fragment_source = `
        precision mediump float;
        varying vec3 vColor; // banyak color (kayak gradasi)
        void main(void) {
            gl_FragColor = vec4(vColor, 1.);
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

    // var uniform_color = GL.getUniformLocation(SHADER_PROGRAM, "uColor"); HAPUS
    var _color = GL.getAttribLocation(SHADER_PROGRAM, "color"); // TAMBAH
    GL.enableVertexAttribArray(_color); // TAMBAH

    /*======================== THE SHAPES ======================== */
    //buat disini
    var triangle_vertex = [
        -0.5, -0.8,          1.0, 0.0, 0.0, // 0: Kiri bawah
         0.5, -0.8,          0.0, 1.0, 0.0, // 1: Kanan bawah
         0.5,  0.2,          0.0, 0.0, 1.0, // 2: Kanan atas
        -0.5,  0.2,          1.0, 1.0, 0.0  // 3: Kiri atas
    ]; //(x,    y             R,   G,   B)

    // menghubungkan 2 segitiga:
    var triangle_faces = [
        0, 1, 2, // Segitiga 1
        0, 2, 3  // Segitiga 2
    ];

    var TRIANGLE_VERTEX = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, TRIANGLE_VERTEX);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(triangle_vertex), GL.STATIC_DRAW);

    var TRIANGLE_FACES = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, TRIANGLE_FACES);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangle_faces), GL.STATIC_DRAW);

    /*========================= RENDERING ========================= */
    GL.clearColor(0.0, 0.5, 0.5, 1.0);
    var animate = function () {
        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT);

        GL.bindBuffer(GL.ARRAY_BUFFER, TRIANGLE_VERTEX);
        GL.vertexAttribPointer(_position, 2, GL.FLOAT, false, 5 * 4, 0);
        GL.vertexAttribPointer(_color, 3, GL.FLOAT, false, 5 * 4, 2 * 4); // TAMBAH
        // GL.uniform3f(uniform_color, 1, 1, 0); // HAPUS
        
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, TRIANGLE_FACES);
        GL.drawElements(GL.TRIANGLES, triangle_faces.length, GL.UNSIGNED_SHORT, 0);

        GL.flush();
        window.requestAnimationFrame(animate);
    };
    animate();
    /*========================= DRAWING ========================= */

}
window.addEventListener('load', main);