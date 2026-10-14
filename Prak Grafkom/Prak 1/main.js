function main() {
    // canvas
    var CANVAS = document.getElementById("mycanvas");
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    // inisialisasi GL
    const GL = CANVAS.getContext("webgl", { antialias: true });

    if (!GL) { // return null kalau GL ga bisa diambil
        alert("WebGL context cannot be initialized");
        return false;
    }

    /* ========================= SHADERS ========================= */
    // shader vertex untuk menentukan translasi, rotasi, skala, proyeksi kamera
    var shader_vertex_source = `
        attribute vec2 position;
 
        void main(void) {
            gl_Position = vec4(position, 0., 1.); // (x,y,z,w) w = untuk perspektif (1 = benda dekat/jauh, besarnya sama dari kamera)
        }`;

    // shader fragment untuk warna, bayangan, tekstur
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
    //buat disini
    // alasan dijadiin array 1D (dibanding 2D) = Memori GPU 1 baris lurus, lebih tidak boros memori
    var triangle_vertex = [
        -0.9, -0.9, // x,y
        0.9, -0.9, // x,y
        0.5, 0.9 // x,y
    ]; // maks x dan y = 1, min = 0

    // buffer = memori di GPU, dipake biar cepet ngambil data nya
    var TRIANGLE_VERTEX = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, TRIANGLE_VERTEX);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(triangle_vertex), GL.STATIC_DRAW);

    /*

    */
    /*========================= RENDERING ========================= */
    GL.clearColor(0.0, 0.5, 0.5, 1.0); // R,G,B,A
    var animate = function () { //fungsi loop render/animasi, dipanggil per frame
        GL.viewport(0, 0, CANVAS.width, CANVAS.height); // tentuin besar viewport
        GL.clear(GL.COLOR_BUFFER_BIT);

        GL.bindBuffer(GL.ARRAY_BUFFER, TRIANGLE_VERTEX);
        GL.vertexAttribPointer(_position, 2, GL.FLOAT, false, 4 * 2, 0); // posisi, (x,y), tipe data, normalisasi data, perlu 4 * 2 byte, offset
        GL.uniform3f(uniform_color, 1, 1, 0); // set color menjadi R = 1, G = 1, B = 0
        GL.drawArrays(GL.TRIANGLES, 0, triangle_vertex.length / 2);

        GL.flush();
        window.requestAnimationFrame(animate);
    };
    animate();
    /*========================= DRAWING ========================= */

}
window.addEventListener('load', main);