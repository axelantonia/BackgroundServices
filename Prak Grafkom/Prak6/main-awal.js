function main() {
  var CANVAS = document.getElementById("mycanvas");
  CANVAS.width = window.innerWidth;
  CANVAS.height = window.innerHeight;

  // Inisialisasi WebGL
  var GL = CANVAS.getContext("webgl", { antialias: true });
  if (!GL) {
    alert("WebGL tidak didukung");
    return false;
  }

  // Ekstensi index 32-bit (Uint32Array / GL.UNSIGNED_INT)
  var EXT = GL.getExtension("OES_element_index_uint");
  if (!EXT) {
    alert("Ekstensi OES_element_index_uint tidak didukung");
    return false;
  }

  /*========================= SHADERS ========================= */
  var shader_vertex_source = `
    attribute vec3 position;
    attribute vec2 uv;
    attribute vec3 normal;

    uniform mat4 Pmatrix, Vmatrix, Mmatrix;

    varying vec2 vUV;
    varying vec3 vNormal;
    varying vec3 vView;

    void main(void) {
        vec4 worldPosition = Mmatrix * vec4(position, 1.0);
        gl_Position = Pmatrix * Vmatrix * worldPosition;
        vUV = uv;

        // PERBAIKAN: Gunakan Mmatrix (bukan Matrix)
        vNormal = vec3(Mmatrix * vec4(normal, 0.0));
        
        // PERBAIKAN: Gunakan Vmatrix (bukan vMatrix)
        vView = vec3(Vmatrix * worldPosition);
    }`;

  var shader_fragment_source = `
    precision mediump float;
    uniform sampler2D sampler;

    varying vec2 vUV;
    varying vec3 vNormal;
    varying vec3 vView;

    const vec3 source_ambient_color = vec3(1.0, 1.0, 1.0);
    const vec3 source_diffuse_color = vec3(0.8, 0.8, 0.8);
    const vec3 source_specular_color = vec3(1.0, 1.0, 1.0);
    const vec3 source_direction = vec3(0.0, 0.0, 1.0);

    const vec3 mat_ambient_color = vec3(0.3, 0.3, 0.3);
    const vec3 mat_diffuse_color = vec3(1.0, 0.4, 0.7);    
    const vec3 mat_specular_color = vec3(1.0, 1.0, 1.0);
    const float mat_shininess = 10.0;

    void main(void) {
        vec3 color = vec3(texture2D(sampler, vUV));
        vec3 N = normalize(vNormal);
        vec3 L = normalize(source_direction);
     
        // Ambient
        vec3 I_ambient = source_ambient_color * mat_ambient_color;

        // Diffuse
        float lambert = max(0.0, dot(N, L));
        vec3 I_diffuse = source_diffuse_color * mat_diffuse_color * lambert;
        
        // Specular
        vec3 I_specular = vec3(0.0);
        if (lambert > 0.0) {
            vec3 V = normalize(-vView);
            vec3 R = reflect(-L, N);
        
            I_specular = source_specular_color * mat_specular_color * pow(max(dot(R, V), 0.0), mat_shininess);
        }
        
        vec3 I = I_ambient + I_diffuse + I_specular;
        
        // PERBAIKAN: Baris penimpa gl_FragColor sebelumnya telah dihapus
        gl_FragColor = vec4(I * color, 1.0);
    }`;

  var compile_shader = function (source, type, typeString) {
    var shader = GL.createShader(type);
    GL.shaderSource(shader, source);
    GL.compileShader(shader);
    if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
      alert(
        "ERROR IN " + typeString + " SHADER : " + GL.getShaderInfoLog(shader)
      );
      return false;
    }
    return shader;
  };

  var shader_vertex = compile_shader(
    shader_vertex_source,
    GL.VERTEX_SHADER,
    "VERTEX"
  );
  var shader_fragment = compile_shader(
    shader_fragment_source,
    GL.FRAGMENT_SHADER,
    "FRAGMENT"
  );

  var SHADER_PROGRAM = GL.createProgram();
  GL.attachShader(SHADER_PROGRAM, shader_vertex);
  GL.attachShader(SHADER_PROGRAM, shader_fragment);
  GL.linkProgram(SHADER_PROGRAM);

  var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");
  GL.enableVertexAttribArray(_position);

  var _uv = GL.getAttribLocation(SHADER_PROGRAM, "uv");
  GL.enableVertexAttribArray(_uv);

  var _normal = GL.getAttribLocation(SHADER_PROGRAM, "normal");
  GL.enableVertexAttribArray(_normal);

  var _sampler = GL.getUniformLocation(SHADER_PROGRAM, "sampler");

  var _Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
  var _Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
  var _Mmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");

  GL.useProgram(SHADER_PROGRAM);
  GL.uniform1i(_sampler, 0);

  /*========================= THE DRAGON ========================= */
  var DRAGON_VERTEX = null,
    DRAGON_FACES = null,
    DRAGON_POINTSCOUNT = 0;

  /*========================= MATRIX ========================= */
  var PROJMATRIX = LIBS.get_projection(
    40,
    CANVAS.width / CANVAS.height,
    1,
    100
  );
  var MOVEMATRIX = LIBS.get_I4();
  var VIEWMATRIX = LIBS.get_I4();

  LIBS.translateZ(VIEWMATRIX, -20);
  LIBS.translateY(VIEWMATRIX, -4);

  /*========================= EVENTS ========================= */
  var THETA = 0,
    PHI = 0;
  var drag = false;
  var x_prev, y_prev;

  var mouseDown = function (e) {
    drag = true;
    x_prev = e.pageX;
    y_prev = e.pageY;
    e.preventDefault();
  };

  var mouseUp = function (e) {
    drag = false;
  };

  var FRICTION = 0.05;
  var dX = 0,
    dY = 0;

  var mouseMove = function (e) {
    if (!drag) return false;
    dX = ((e.pageX - x_prev) * 2 * Math.PI) / CANVAS.width;
    dY = ((e.pageY - y_prev) * 2 * Math.PI) / CANVAS.height;
    THETA += dX;
    PHI += dY;
    x_prev = e.pageX;
    y_prev = e.pageY;
    e.preventDefault();
  };

  CANVAS.addEventListener("mousedown", mouseDown, false);
  CANVAS.addEventListener("mouseup", mouseUp, false);
  CANVAS.addEventListener("mouseout", mouseUp, false);
  CANVAS.addEventListener("mousemove", mouseMove, false);

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

  /*========================= TEXTURES =========================*/
  var load_texture = function (image_URL) {
    var texture = GL.createTexture();
    var image = new Image();

    image.src = image_URL;
    image.onload = function () {
      GL.bindTexture(GL.TEXTURE_2D, texture);
      GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
      GL.texImage2D(
        GL.TEXTURE_2D,
        0,
        GL.RGBA,
        GL.RGBA,
        GL.UNSIGNED_BYTE,
        image
      );

      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);

      GL.bindTexture(GL.TEXTURE_2D, null);
    };

    return texture;
  };

  var dragon_texture = load_texture("resources/dragon.png");

  /*========================= DRAWING ========================= */
  GL.enable(GL.DEPTH_TEST);
  GL.depthFunc(GL.LEQUAL);
  GL.clearDepth(1.0);
  GL.clearColor(0.0, 0.0, 0.0, 1.0);

  var animate = function (time) {
    GL.viewport(0, 0, CANVAS.width, CANVAS.height);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    LIBS.set_I4(MOVEMATRIX);
    LIBS.rotateY(MOVEMATRIX, THETA);
    LIBS.rotateX(MOVEMATRIX, PHI);

    if (!drag) {
      dX *= 1 - FRICTION;
      dY *= 1 - FRICTION;
      THETA += dX;
      PHI += dY;
    }

    GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
    GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
    GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);

    // Stride = 4 bytes * (3 pos + 3 normal + 2 uv) = 32 bytes
    GL.bindBuffer(GL.ARRAY_BUFFER, DRAGON_VERTEX);
    GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 4 * 8, 0);
    GL.vertexAttribPointer(_normal, 3, GL.FLOAT, false, 4 * 8, 4 * 3);
    GL.vertexAttribPointer(_uv, 2, GL.FLOAT, false, 4 * 8, 4 * 6);

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, DRAGON_FACES);

    GL.activeTexture(GL.TEXTURE0);
    GL.bindTexture(GL.TEXTURE_2D, dragon_texture);

    GL.drawElements(GL.TRIANGLES, DRAGON_POINTSCOUNT, GL.UNSIGNED_INT, 0);

    GL.flush();
    requestAnimationFrame(animate);
  };

  /*========================= LOAD MODEL ========================= */
  LIBS.get_json("resources/dragon.json", function (dragon) {
    DRAGON_VERTEX = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, DRAGON_VERTEX);
    GL.bufferData(
      GL.ARRAY_BUFFER,
      new Float32Array(dragon.vertices),
      GL.STATIC_DRAW
    );

    DRAGON_FACES = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, DRAGON_FACES);
    GL.bufferData(
      GL.ELEMENT_ARRAY_BUFFER,
      new Uint32Array(dragon.indices),
      GL.STATIC_DRAW
    );

    DRAGON_POINTSCOUNT = dragon.indices.length;

    animate(0);
  });
}

window.addEventListener("load", main);