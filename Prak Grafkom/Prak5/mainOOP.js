import { Limb, Mat } from "./Limb.js";

function main() {
    /** @type {HTMLCanvasElement} */
    var CANVAS = document.getElementById("mycanvas");
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

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
        attribute vec3 normal;
        uniform mat4 Pmatrix, Vmatrix, Mmatrix;
        uniform vec3 color;
        varying vec3 vColor;
        varying vec3 vNormal;

        void main(void) {
            gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.);
            vNormal = mat3(Mmatrix) * normal;
            vColor = color;
        }`;

    var shader_fragment_source = `
        precision mediump float;
        varying vec3 vColor;
        varying vec3 vNormal;

        void main(void) {
            vec3 L = normalize(vec3(0.4, 0.8, 1.0));
            float d = max(dot(normalize(vNormal), L), 0.0);
            gl_FragColor = vec4(vColor * (0.45 + 0.6 * d), 1.);
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
    var _normal = GL.getAttribLocation(SHADER_PROGRAM, "normal");
    GL.enableVertexAttribArray(_normal);

    var _Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
    var _Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
    var _Mmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");
    var _color   = GL.getUniformLocation(SHADER_PROGRAM, "color");

    GL.useProgram(SHADER_PROGRAM);

    var locs = { position: _position, normal: _normal, color: _color, Mmatrix: _Mmatrix };

    /*========================= MEMBUAT OBJEK ========================= */
    var GREY   = [0.82, 0.82, 0.80];
    var BLUE   = [0.22, 0.42, 0.80];
    var YELLOW = [0.85, 0.76, 0.40];
    var GREEN  = [0.25, 0.72, 0.25];
    var RED    = [0.80, 0.20, 0.20];

    var R_ARM = 0.38, L_UPPER = 1.0, L_MID = 1.0, L_LOW = 0.9;
    var R_LEG = 0.35, L_THIGH = 1.1, L_CALF = 1.1, L_FOOT = 0.6;

    // Badan = poros utama
    var Body = new Limb(GL, locs, { radius: 0.9, length: 2.2, topY: 1.1, color: GREY, pos: [0, 0, 0] });
    // Kepala
    var Head = new Limb(GL, locs, { radius: 0.95, length: 0, topY: 0, color: GREY, pos: [0, 2.85, 0] });
    Body.childs.push(Head);

    // ---- TANGAN ----
    function makeArm(side) {
        var blue   = new Limb(GL, locs, { radius: R_ARM, length: L_UPPER, topY: 0, color: BLUE,   pos: [side * 1.3, 1.1, 0] });
        var yellow = new Limb(GL, locs, { radius: R_ARM, length: L_MID,   topY: 0, color: YELLOW, pos: [0, -L_UPPER, 0] });
        var green  = new Limb(GL, locs, { radius: R_ARM, length: L_LOW,   topY: 0, color: GREEN,  pos: [0, -L_MID, 0] });

        Body.childs.push(blue);
        blue.childs.push(yellow);
        yellow.childs.push(green);
        return { side: side, blue: blue, yellow: yellow, green: green };
    }
    var ArmJab   = makeArm(+1);   // tangan kiri  : jab & hook
    var ArmCross = makeArm(-1);   // tangan kanan : cross & uppercut

    // ---- KAKI & KUDA-KUDA ----
    function makeLeg(side) {
        // Paha (Upper Leg)
        var thigh = new Limb(GL, locs, { radius: R_LEG,       length: L_THIGH, topY: 0, color: GREY, pos: [side * 0.45, -1.0, 0] });
        // Betis (Lower Leg)
        var calf  = new Limb(GL, locs, { radius: R_LEG * 0.8, length: L_CALF,  topY: 0, color: GREY, pos: [0, -L_THIGH, 0] });
        // Telapak Kaki (Foot / Sepatu)
        var foot  = new Limb(GL, locs, { radius: R_LEG * 0.7, length: L_FOOT,  topY: 0, color: RED,  pos: [0, -L_CALF, 0] });

        Body.childs.push(thigh);
        thigh.childs.push(calf);
        calf.childs.push(foot);
        return { side: side, thigh: thigh, calf: calf, foot: foot };
    }
    var LegLeft  = makeLeg(+1);   // Kaki Kiri (Depan pada Orthodox Stance)
    var LegRight = makeLeg(-1);   // Kaki Kanan (Belakang pada Orthodox Stance)

    Body.setup();   // setup() otomatis memanggil setup() semua child

    /*========================= ANIMASI TINJU & FOOTWORK ========================= */
    var CYCLE_MS = 3800;      // durasi 1 kombo
    var BASE_YAW = -1.1;      // sudut pandang petinju menyamping

    // ---- pose dasar tangan ----
    var GUARD_A = { U: [0.10, -0.85, 0.50], F: [-0.25, 0.80, 0.55], H: [-0.30, 0.85, 0.40] };
    var GUARD_B = { U: [0.10, -0.85, 0.40], F: [-0.30, 0.85, 0.45], H: [-0.35, 0.85, 0.35] };

    // ---- pose pukulan tangan ----
    var JAB     = { U: [-0.05, 0.10, 1.00], F: [-0.25, 0.10, 0.95], H: [-0.35, 0.10, 0.90] };
    var CROSS   = { U: [-0.30, 0.12, 0.95], F: [-0.50, 0.10, 0.88], H: [-0.55, 0.10, 0.82] };
    var HOOK_W  = { U: [ 0.90, 0.15,-0.10], F: [ 0.25, 0.35, 0.90], H: [ 0.30, 0.30, 0.90] };
    var HOOK_P  = { U: [ 0.85, 0.25, 0.40], F: [-0.75, 0.35, 0.55], H: [-0.80, 0.30, 0.50] };
    var UPPER_W = { U: [ 0.20,-0.95, 0.15], F: [ 0.00,-0.55, 0.80], H: [ 0.00,-0.60, 0.75] };
    var UPPER_P = { U: [ 0.05,-0.40, 0.90], F: [-0.20, 0.90, 0.40], H: [-0.25, 0.90, 0.35] };

    function key(t, yaw, A, B) {
        return { t: t, v: [yaw].concat(A.U, A.F, A.H, B.U, B.F, B.H) };
    }

    var KEYS = [
        key(0.00,  0.00, GUARD_A, GUARD_B),
        key(0.06, -0.20, JAB,     GUARD_B),
        key(0.13,  0.00, GUARD_A, GUARD_B),
        key(0.20,  0.60, GUARD_A, CROSS),
        key(0.27,  0.10, GUARD_A, GUARD_B),
        key(0.35,  0.30, HOOK_W,  GUARD_B),
        key(0.42, -0.65, HOOK_P,  GUARD_B),
        key(0.50, -0.10, GUARD_A, GUARD_B),
        key(0.58, -0.20, GUARD_A, UPPER_W),
        key(0.65,  0.55, GUARD_A, UPPER_P),
        key(0.73,  0.10, GUARD_A, GUARD_B),
        key(0.86,  0.00, GUARD_A, GUARD_B)
    ];

    function sample(t) {
        var N = KEYS.length;
        var T = function (j) { return KEYS[((j % N) + N) % N].t + Math.floor(j / N); };
        var P = function (j) { return KEYS[((j % N) + N) % N].v; };

        var i = 0;
        while (i < N - 1 && t >= KEYS[i + 1].t) i++;

        var t0 = T(i), t1 = T(i + 1), dt = t1 - t0;
        var u = (t - t0) / dt;
        var pm = P(i - 1), p0 = P(i), p1 = P(i + 1), pp = P(i + 2);
        var k0 = dt / (t1 - T(i - 1));
        var k1 = dt / (T(i + 2) - t0);

        var u2 = u * u, u3 = u2 * u;
        var h00 = 2*u3 - 3*u2 + 1, h10 = u3 - 2*u2 + u, h01 = -2*u3 + 3*u2, h11 = u3 - u2;

        var out = new Array(p0.length);
        for (var n = 0; n < out.length; n++) {
            var m0 = (p1[n] - pm[n]) * k0;
            var m1 = (pp[n] - p0[n]) * k1;
            out[n] = h00 * p0[n] + h10 * m0 + h01 * p1[n] + h11 * m1;
        }
        return out;
    }

    function dirAtVec(v, side, yaw) {
        var x = v[0] * side, y = v[1], z = v[2];
        var l = Math.hypot(x, y, z) || 1;
        x /= l; y /= l; z /= l;
        var c = Math.cos(yaw), sn = Math.sin(yaw);
        return [c * x + sn * z, y, -sn * x + c * z];
    }

    function dirAt(s, o, side, yaw) {
        return dirAtVec([s[o], s[o + 1], s[o + 2]], side, yaw);
    }

    function applyPose(t) {
        var s = sample(t);
        var yaw = BASE_YAW + s[0];

        // Tangan kiri & kanan
        ArmJab.blue.targetDir   = dirAt(s,  1, ArmJab.side, yaw);
        ArmJab.yellow.targetDir = dirAt(s,  4, ArmJab.side, yaw);
        ArmJab.green.targetDir  = dirAt(s,  7, ArmJab.side, yaw);

        ArmCross.blue.targetDir   = dirAt(s, 10, ArmCross.side, yaw);
        ArmCross.yellow.targetDir = dirAt(s, 13, ArmCross.side, yaw);
        ArmCross.green.targetDir  = dirAt(s, 16, ArmCross.side, yaw);

        // ================= SOVIET STYLE FOOTWORK & KUDA-KUDA =================
        // 1. Pergerakan maju 1x (t: 0.0 -> 0.4) dan mundur 1x (t: 0.4 -> 0.8)
        var stepZ = 0;
        var stepPhase = 0;
        if (t < 0.4) {
            stepPhase = t / 0.4;
            stepZ = 1.3 * (0.5 - 0.5 * Math.cos(stepPhase * Math.PI)); // Maju 1x
        } else if (t < 0.8) {
            stepPhase = (t - 0.4) / 0.4;
            stepZ = 1.3 * (0.5 + 0.5 * Math.cos(stepPhase * Math.PI)); // Mundur 1x
        } else {
            stepZ = 0; // Guard di tempat
        }

        // 2. Soviet Style Pendulum Bounce (Ritme jingkat cepat dan dinamis)
        var bounceFreq = 14;
        var bounceFactor = Math.sin(t * Math.PI * bounceFreq);
        var pendulumY = 0.10 * Math.abs(bounceFactor);

        // Transformasi Badan (Translate sesuai pergerakan maju/mundur di sumbu hadap)
        var moveX = stepZ * Math.sin(yaw);
        var moveZ = stepZ * Math.cos(yaw);
        Body.POSITION_MATRIX = Mat.translate(moveX, 0.05 + pendulumY, moveZ);
        Body.MOVE_MATRIX = Mat.rotateY(yaw);

        // 3. Pose & Ayunan Kaki dalam Kuda-Kuda Boxing (Orthodox Stance)
        var legSwing = Math.sin(stepPhase * Math.PI) * 0.3;
        var kneeFlex = 0.08 * bounceFactor;

        // Kaki Kiri (Depan / Lead Leg)
        var L_thigh = [ 0.15, -0.85 + kneeFlex,  0.45 + (t < 0.4 ? legSwing : -legSwing * 0.5)];
        var L_calf  = [-0.10, -0.85 - kneeFlex, -0.40];
        var L_foot  = [ 0.00, -0.15,             0.95];

        // Kaki Kanan (Belakang / Rear Leg)
        var R_thigh = [ 0.20, -0.80 + kneeFlex, -0.50 + (t >= 0.4 && t < 0.8 ? -legSwing : legSwing * 0.5)];
        var R_calf  = [-0.10, -0.85 - kneeFlex,  0.45];
        var R_foot  = [ 0.00, -0.15,             0.95];

        LegLeft.thigh.targetDir = dirAtVec(L_thigh, LegLeft.side, yaw);
        LegLeft.calf.targetDir  = dirAtVec(L_calf,  LegLeft.side, yaw);
        LegLeft.foot.targetDir  = dirAtVec(L_foot,  LegLeft.side, yaw);

        LegRight.thigh.targetDir = dirAtVec(R_thigh, LegRight.side, yaw);
        LegRight.calf.targetDir  = dirAtVec(R_calf,  LegRight.side, yaw);
        LegRight.foot.targetDir  = dirAtVec(R_foot,  LegRight.side, yaw);
    }

    /*========================= MATRIKS KAMERA ========================= */
    var PROJMATRIX = LIBS.get_projection(40, CANVAS.width / CANVAS.height, 1, 100);
    // Posisi kamera disesuaikan agar seluruh tubuh dan pergerakan kaki terlihat jelas
    var VIEWMATRIX = Mat.mul(Mat.translate(0, -0.2, -16), Mat.rotateX(0.10));

    /*========================= DRAWING ========================= */
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
    GL.clearColor(0.0, 0.0, 0.0, 1.0);
    GL.clearDepth(1.0);

    var animate = function (time) {
        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        var t = (time % CYCLE_MS) / CYCLE_MS;
        applyPose(t);

        GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
        GL.uniformMatrix4fv(_Vmatrix, false, new Float32Array(VIEWMATRIX));

        Body.render(Mat.identity());

        GL.flush();
        window.requestAnimationFrame(animate);
    };
    animate(0);
}
window.addEventListener('load', main);