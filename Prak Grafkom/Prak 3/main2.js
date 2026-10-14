function main() {
  var CANVAS = document.getElementById("mycanvas");
  CANVAS.width = window.innerWidth;
  CANVAS.height = window.innerHeight;

  // Inisialisasi WebGL
  var GL;
  GL = CANVAS.getContext("webgl", { antialias: true });
  if (!GL) {
    alert("WebGL tidak didukung");
    return false;
  }

  var shader_vertex_source = `
    attribute vec3 position; // menggunakan vec3 krn 3 dimensi
    uniform mat4 Pmatrix, Vmatrix, Mmatrix;
    attribute vec3 color;
    varying vec3 vColor;

    attribute vec2 uv;
    varying vec2 vUV;

    void main(void) {
         
        // Pmatrix = projection matrix, Vmatrix = view matrix, Mmatrix = model matrix, vec4 = vertex objek
        
        // Mmatrix = object --> world (objek ini diletakan dimana? skala brp? rotasi brp?)
        // Vmatrix = world --> camera (letak kamera dimana? rotasi kamera brp?)
        // Pmatrix = camera --> clip space (bagaimana menggepengkan bidang 3d jadi 2d di layar dan seberapa besar bidang 3d yang terlihat di layar)

        gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.); 
        // vColor = color; 

        vUV = uv;

        //gl_PointSize = 10.0;
    }`;

  var shader_fragment_source = `
    precision mediump float;
    // uniform float greyScality;
    // uniform vec3 uColor;
    // varying vec3 vColor;


    uniform sampler2D sampler;
    varying vec2 vUV;

    void main(void) {                    //  ----------- DR uColor -------------- opacity
        gl_FragColor = texture2D(sampler, vUV);

    }`;

  var compile_shader = function (source, type, typeString) {
    var shader = GL.createShader(type);
    GL.shaderSource(shader, source);
    GL.compileShader(shader);
    if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
      alert(
        "ERROR IN " + typeString + " SHADER : " + GL.getShaderInfoLog(shader),
      );
      return false;
    }
    return shader;
  };

  var shader_vertex = compile_shader(
    shader_vertex_source,
    GL.VERTEX_SHADER,
    "VERTEX",
  );
  var shader_fragment = compile_shader(
    shader_fragment_source,
    GL.FRAGMENT_SHADER,
    "FRAGMENT",
  );

  var SHADER_PROGRAM = GL.createProgram();
  GL.attachShader(SHADER_PROGRAM, shader_vertex);
  GL.attachShader(SHADER_PROGRAM, shader_fragment);
  GL.linkProgram(SHADER_PROGRAM);

  var _greyScaliity = GL.getUniformLocation(SHADER_PROGRAM, "greyScality");

  var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");
  GL.enableVertexAttribArray(_position);
  GL.useProgram(SHADER_PROGRAM);

  // var _color = GL.getAttribLocation(SHADER_PROGRAM, "color");
  // GL.enableVertexAttribArray(_color);

  // GL.useProgram(SHADER_PROGRAM);

  var _uv = GL.getAttribLocation(SHADER_PROGRAM, "uv");
  GL.enableVertexAttribArray(_uv);
  GL.useProgram(SHADER_PROGRAM);

  var _sampler = GL.getUniformLocation(SHADER_PROGRAM, "sampler");
  GL.uniform1f(_sampler, 0); // set uniform sampler ke texture unit 0

  var cube_vertex = [
    // Front face (Z = 1)
    -1, -1,  1,     0.25, 0.3333,
     1, -1,  1,     0.50, 0.3333,
     1,  1,  1,     0.50, 0.6667,
    -1,  1,  1,     0.25, 0.6667,

    // Back face (Z = -1)
     1, -1, -1,     0.75, 0.3333,
    -1, -1, -1,     1.00, 0.3333,
    -1,  1, -1,     1.00, 0.6667,
     1,  1, -1,     0.75, 0.6667,

    // Left face (X = -1)
    -1, -1, -1,     0.00, 0.3333,
    -1, -1,  1,     0.25, 0.3333,
    -1,  1,  1,     0.25, 0.6667,
    -1,  1, -1,     0.00, 0.6667,

    // Right face (X = 1)
     1, -1,  1,     0.50, 0.3333,
     1, -1, -1,     0.75, 0.3333,
     1,  1, -1,     0.75, 0.6667,
     1,  1,  1,     0.50, 0.6667,

    // Top face (Y = 1)
    -1,  1,  1,     0.25, 0.6667,
     1,  1,  1,     0.50, 0.6667,
     1,  1, -1,     0.50, 1.0000,
    -1,  1, -1,     0.25, 1.0000,

    // Bottom face (Y = -1)
    -1, -1, -1,     0.25, 0.0000,
     1, -1, -1,     0.50, 0.0000,
     1, -1,  1,     0.50, 0.3333,
    -1, -1,  1,     0.25, 0.3333,
  ];

  var cube_faces = [
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14,
    15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
  ];

  var CUBE_VERTEX = GL.createBuffer();
  GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX);
  GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(cube_vertex), GL.STATIC_DRAW);

  var CUBE_FACES = GL.createBuffer();
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
  GL.bufferData(
    GL.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(cube_faces),
    GL.STATIC_DRAW,
  );

  // Ambil lokasi uniform matrix dari shader --> return nya location
  var _Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
  var _Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
  var _Mmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");

  // Inisialisasi matriks transformasi --> untuk diisikan ke uniform matrix di shader
  //                                   (angle/zoom, aspect ratio, near, far) near dan far adalah jarak min/max kamera ke objek yang terlihat di layar
  var PROJMATRIX = LIBS.get_projection(
    40,
    CANVAS.width / CANVAS.height,
    1,
    100,
  );
  // angle kecil = zoom in, angle besar = zoom out
  var MOVEMATRIX = LIBS.get_I4();
  var VIEWMATRIX = LIBS.get_I4();

  // Geser kamera ke belakang agar objek terlihat
  LIBS.translateZ(VIEWMATRIX, -6); // camera mundur 6 unit ke belakang

  /*========================= EVENTS ========================= */
  var THETA = 0,
    PHI = 0; // simpan sudut rotasi untuk mouse event
  var drag = false; // tanda mouuse diteken
  var x_prev, y_prev;

  var mouseDown = function (e) {
    drag = true;
    ((x_prev = e.pageX), (y_prev = e.pageY));
    e.preventDefault();
  };

  var mouseUp = function (e) {
    drag = false;
  };

  // no friction
  // var mouseMove = function (e) {
  //     if (!drag) return false;
  //     var dX = (e.pageX - x_prev) * 2 * Math.PI / CANVAS.width;
  //     var dY = (e.pageY - y_prev) * 2 * Math.PI / CANVAS.height;
  //     THETA += dX;
  //     PHI += dY;
  //     x_prev = e.pageX, y_prev = e.pageY;
  //     e.preventDefault();
  // };

  // with friction
  var FRICTION = 0.05; // nilai friction, semakin besar semakin cepat berhenti
  var dX = 0,
    dY = 0;

  var mouseMove = function (e) {
    if (!drag) return false;
    dX = ((e.pageX - x_prev) * 2 * Math.PI) / CANVAS.width; // 1 putaran penuh
    dY = ((e.pageY - y_prev) * 2 * Math.PI) / CANVAS.height;
    THETA += dX;
    PHI += dY;
    ((x_prev = e.pageX), (y_prev = e.pageY));
    e.preventDefault();
  };

  CANVAS.addEventListener("mousedown", mouseDown, false);
  CANVAS.addEventListener("mouseup", mouseUp, false);
  CANVAS.addEventListener("mouseout", mouseUp, false);
  CANVAS.addEventListener("mousemove", mouseMove, false);

  // with keyboard event
  var SPEED = 0.1;
  var keyDown = function (e) {
    if (e.key === "w") {
      dY -= SPEED;
    } else if (e.key === "a") {
      dX -= SPEED;
    } else if (e.key === "s") {
      dY += SPEED;
    } else if (e.key === "d") {
      dX += SPEED;
    }
  };
  window.addEventListener("keydown", keyDown, false);

  /*========================= DRAWING ========================= */
  GL.enable(GL.DEPTH_TEST); // menyalakan depth test agar objek yang di depan menutupi objek yang di belakang
  GL.depthFunc(GL.LEQUAL); // jenis yg dipakai untuk depth test, LEQUAL = less than or equal, artinya jika depth lebih kecil atau sama dengan depth sebelumnya maka akan ditampilkan, jika lebih besar maka tidak ditampilkan
  GL.clearDepth(1.0); // nilai depth awal, 0.0 = dekat kamera, 1.0 = jauh dari kamera

  GL.clearColor(0.0, 0.0, 0.0, 1.0);

  var time_prev = 0;
  var animate = function (time) {
    GL.viewport(0, 0, CANVAS.width, CANVAS.height);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    // Mouseevent
    LIBS.set_I4(MOVEMATRIX);
    LIBS.rotateY(MOVEMATRIX, THETA);
    LIBS.rotateX(MOVEMATRIX, PHI);

    // Tambahkan friction pada animate dibawah LIBS.rotateX(MOVEMATRIX, PHI);
    if (!drag) {
      dX *= 1 - FRICTION;
      dY *= 1 - FRICTION;
      THETA += dX;
      PHI += dY;
    }

    // salin nilai yg di inisialisasi ke uniform matrix di shader sesuai alamat
    GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
    GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
    GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);

    // bind buffer vertex dan atur pointer ke attribute position dan color di shader
    GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX);
    GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 4 * (3 + 2), 0);
    GL.vertexAttribPointer(_uv, 2, GL.FLOAT, false, 4 * (3 + 2), 4 * 3);

    // bind buffer faces dan gambar objek sesuai faces yg di bind
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
    GL.uniform1f(_greyScaliity, 0.9); // set nilai greyScality ke 0.5
    GL.drawElements(GL.TRIANGLES, cube_faces.length, GL.UNSIGNED_SHORT, 0);


    GL.activeTexture(GL.TEXTURE0); // aktifkan texture unit 0
    GL.bindTexture(GL.TEXTURE_2D, cube_texture); // bind texture ke texture unit 0

    GL.flush();
    requestAnimationFrame(animate);
  };
  animate(0);

  var load_texture = function (url) {
    var texture = GL.createTexture();

    var image = new Image();
    image.src = url;
    image.onload = function(){
        GL.bindTexture(GL.TEXTURE_2D, texture);
        GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);

        
        GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
        
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);

        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);

        GL.bindTexture(GL.TEXTURE_2D, null);
    }
    return texture;
  }

  var cube_texture = load_texture("skybox1.png");

}

window.addEventListener("load", main);