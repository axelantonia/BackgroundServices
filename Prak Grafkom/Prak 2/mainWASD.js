function main() {
    /** @type {HTMLCanvasElement} */
    var CANVAS = document.getElementById("mycanvas");
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    // 1. System Tracking Keyboard untuk Multi-Key (Bisa tekan W + D bersamaan)
    var keys = {};

    window.addEventListener("keydown", function (e) {
        keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener("keyup", function (e) {
        keys[e.key.toLowerCase()] = false;
    });

    // 2. System Tracking Mouse Drag
    var drag = false;
    var x_prev, y_prev;
    var dX = 0, dY = 0;
    var FRICTION = 0.05; // Inersia/perlambatan rotasi
    var ACCEL = 0.003;    // Kecepatan rotasi tombol keyboard

    var mouseDown = function (e) {
        drag = true;
        x_prev = e.pageX;
        y_prev = e.pageY;
        e.preventDefault();
        return false;
    };

    var mouseUp = function (e) {
        drag = false;
    };

    var mouseMove = function (e) {
        if (!drag) return false;
        // Hitung perubahan posisi mouse secara bersamaan (X dan Y)
        dX = (e.pageX - x_prev) * 2 * Math.PI / CANVAS.width;
        dY = (e.pageY - y_prev) * 2 * Math.PI / CANVAS.height;
        x_prev = e.pageX;
        y_prev = e.pageY;
        e.preventDefault();
    };

    CANVAS.addEventListener("mousedown", mouseDown, false);
    CANVAS.addEventListener("mouseup", mouseUp, false);
    CANVAS.addEventListener("mouseout", mouseUp, false);
    CANVAS.addEventListener("mousemove", mouseMove, false);

    /*===================== GET WEBGL CONTEXT ===================== */
    /** @type {WebGLRenderingContext} */
    var GL;
    try {
        GL = CANVAS.getContext("webgl", { antialias: true });
    } catch (e) {
        alert("WebGL context cannot be initialized");
        return false;
    }

    /*========================= SHADERS ========================= */
    var shader_vertex_source = `
        attribute vec3 position;
        uniform mat4 Pmatrix, Vmatrix, Mmatrix;
        attribute vec3 color;
        varying vec3 vColor;
        
        void main(void) {
            gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.);
            vColor = color;
        }`;

    var shader_fragment_source = `
        precision mediump float;
        varying vec3 vColor;
        
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

    var shader_vertex = compile_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
    var shader_fragment = compile_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

    var SHADER_PROGRAM = GL.createProgram();
    GL.attachShader(SHADER_PROGRAM, shader_vertex);
    GL.attachShader(SHADER_PROGRAM, shader_fragment);
    GL.linkProgram(SHADER_PROGRAM);

    var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");
    GL.enableVertexAttribArray(_position);

    var _color = GL.getAttribLocation(SHADER_PROGRAM, "color");
    GL.enableVertexAttribArray(_color);

    var _Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
    var _Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
    var _Mmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");

    GL.useProgram(SHADER_PROGRAM);

    // Matriks Transformasi
    var PROJMATRIX = LIBS.get_projection(40, CANVAS.width / CANVAS.height, 1, 100);
    var MOVEMATRIX = LIBS.get_I4();
    var VIEWMATRIX = LIBS.get_I4();

    LIBS.translateZ(VIEWMATRIX, -6);

    /*======================== CYLINDER GEOMETRY ======================== */
    var cylinder_vertex = [];
    var cylinder_faces = [];

    var radius = 1.0;
    var height = 2.0;
    var segments = 36;

    // Titik Pusat (Atas idx 0, Bawah idx 1)
    cylinder_vertex.push(0, height / 2, 0, 1.0, 0.2, 0.5);
    cylinder_vertex.push(0, -height / 2, 0, 0.2, 0.5, 1.0);

    for (var i = 0; i <= segments; i++) {
        var angle = (i * 2 * Math.PI) / segments;
        var x = radius * Math.cos(angle);
        var z = radius * Math.sin(angle);

        var r = (Math.cos(angle) + 1) / 2;
        var g = (Math.sin(angle) + 1) / 2;
        var b = 0.8;

        cylinder_vertex.push(x, height / 2, z, r, g, b);
        cylinder_vertex.push(x, -height / 2, z, r * 0.4, g * 0.4, b);
    }

    for (var i = 0; i < segments; i++) {
        var topIdx1 = 2 + i * 2;
        var botIdx1 = 2 + i * 2 + 1;
        var topIdx2 = 2 + (i + 1) * 2;
        var botIdx2 = 2 + (i + 1) * 2 + 1;

        // Dinding Tabung
        cylinder_faces.push(topIdx1, botIdx1, topIdx2);
        cylinder_faces.push(topIdx2, botIdx1, botIdx2);

        // Tutup Atas
        cylinder_faces.push(0, topIdx2, topIdx1);

        // Tutup Bawah
        cylinder_faces.push(1, botIdx1, botIdx2);
    }

    var CYLINDER_VERTEX = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, CYLINDER_VERTEX);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(cylinder_vertex), GL.STATIC_DRAW);

    var CYLINDER_FACES = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CYLINDER_FACES);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cylinder_faces), GL.STATIC_DRAW);

    /*========================= DRAWING ========================= */
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
    GL.clearColor(0.0, 0.0, 0.0, 1.0);
    GL.clearDepth(1.0);

    var animate = function (time) {
        // Cek input keyboard secara mandiri (bisa kombinasi W+D bersamaan)
        if (keys['w']) dY -= ACCEL;
        if (keys['s']) dY += ACCEL;
        if (keys['a']) dX -= ACCEL;
        if (keys['d']) dX += ACCEL;

        // Rotasi secara kumulatif langsung ke MOVEMATRIX (Bisa putar 360 derajat diagonal bebas)
        LIBS.rotateY(MOVEMATRIX, dX);
        LIBS.rotateX(MOVEMATRIX, dY);

        // Redam kecepatan (friction/inersia)
        dX *= (1 - FRICTION);
        dY *= (1 - FRICTION);

        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
        GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
        GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);

        GL.bindBuffer(GL.ARRAY_BUFFER, CYLINDER_VERTEX);
        GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 4 * (3 + 3), 0);
        GL.vertexAttribPointer(_color, 3, GL.FLOAT, false, 4 * (3 + 3), 4 * 3);

        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CYLINDER_FACES);
        GL.drawElements(GL.TRIANGLES, cylinder_faces.length, GL.UNSIGNED_SHORT, 0);

        GL.flush();
        requestAnimationFrame(animate);
    };
    animate(0);
}

window.addEventListener('load', main);