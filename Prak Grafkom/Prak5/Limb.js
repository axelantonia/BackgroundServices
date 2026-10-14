/* =====================================================================
   Limb.js  -  satu bagian tubuh (kapsul) dengan struktur parent-child
   ===================================================================== */

/* ---------- helper matriks 4x4 (column-major, sama seperti WebGL) ---------- */
export const Mat = {
    identity: () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],

    mul: (a, b) => {                       // hasil = a * b
        const o = new Array(16).fill(0);
        for (let c = 0; c < 4; c++)
            for (let r = 0; r < 4; r++)
                for (let k = 0; k < 4; k++)
                    o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
        return o;
    },

    translate: (x, y, z) => [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1],

    rotateX: (a) => { const c = Math.cos(a), s = Math.sin(a); return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]; },
    rotateY: (a) => { const c = Math.cos(a), s = Math.sin(a); return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]; },

    // ROTASI MENGELILINGI SUMBU ARBITRER (rumus Rodrigues)
    axisAngle: (ax, ay, az, a) => {
        const len = Math.hypot(ax, ay, az) || 1;
        const x = ax / len, y = ay / len, z = az / len;
        const c = Math.cos(a), s = Math.sin(a), t = 1 - c;
        return [
            t*x*x + c,   t*x*y + s*z, t*x*z - s*y, 0,
            t*x*y - s*z, t*y*y + c,   t*y*z + s*x, 0,
            t*x*z + s*y, t*y*z - s*x, t*z*z + c,   0,
            0, 0, 0, 1
        ];
    }
};

/* ---------- kelas Limb ---------- */
export class Limb {
    /**
     * @param {WebGLRenderingContext} GL
     * @param {object} locs  {position, normal, color, Mmatrix} (lokasi attribute/uniform)
     * @param {object} o     {radius, length, topY, color, pos:[x,y,z]}
     *   - Kapsul: pusat bola atas di y = topY, pusat bola bawah di y = topY - length.
     *   - Titik (0,0,0) lokal = PORO/SENDI tempat bagian ini berputar.
     *   - pos = posisi poros relatif terhadap parent.
     */
    constructor(GL, locs, o) {
        this.GL = GL;
        this.locs = locs;
        this.opt = o;
        this.color = o.color;

        this.childs = [];
        this.POSITION_MATRIX = Mat.translate(...(o.pos || [0, 0, 0]));  // letak poros
        this.MOVE_MATRIX = Mat.identity();                              // rotasi di poros

        // Jika diisi, limb ini diputar (sumbu arbitrer) supaya menunjuk ke arah ini
        // (arah dinyatakan dalam sistem koordinat badan / dunia).
        this.targetDir = null;
        this.axis = [0, 0, 1];
        this.angle = 0;
    }

    setup() {
        const GL = this.GL, { radius: r, length: L, topY } = this.opt;
        const S = 12, N = 28;             // resolusi: stack per belahan, sektor
        const verts = [], idx = [], rings = [];

        for (let h = 0; h < 2; h++)
            for (let i = 0; i <= S; i++) {
                const phi = (h === 0 ? 0 : Math.PI / 2) + (i / S) * Math.PI / 2;
                rings.push({ phi, cy: h === 0 ? topY : topY - L });
            }

        rings.forEach(({ phi, cy }) => {
            for (let j = 0; j <= N; j++) {
                const th = (j / N) * 2 * Math.PI;
                const nx = Math.sin(phi) * Math.cos(th);
                const ny = Math.cos(phi);
                const nz = Math.sin(phi) * Math.sin(th);
                verts.push(r * nx, cy + r * ny, r * nz,   nx, ny, nz);
            }
        });

        for (let k = 0; k < rings.length - 1; k++)
            for (let j = 0; j < N; j++) {
                const a = k * (N + 1) + j, b = a + 1, c = (k + 1) * (N + 1) + j, d = c + 1;
                idx.push(a, c, b,  b, c, d);
            }

        this.vbo = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, this.vbo);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(verts), GL.STATIC_DRAW);

        this.ibo = GL.createBuffer();
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.ibo);
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), GL.STATIC_DRAW);
        this.count = idx.length;

        this.childs.forEach(c => c.setup());
    }

    /**
     * Hitung MOVE_MATRIX dari arah tujuan (ruang badan).
     * Arah dikonversi dulu ke ruang lokal parent, lalu dicari sumbu arbitrer
     * = cross(arah_awal, arah_tujuan) dan sudut = acos(dot). Arah awal limb = (0,-1,0).
     */
    aimAt(parentMatrix) {
        const m = parentMatrix, d = this.targetDir;
        // arah lokal = (rotasi parent)^T * d
        const lx = m[0]*d[0] + m[1]*d[1] + m[2]*d[2];
        const ly = m[4]*d[0] + m[5]*d[1] + m[6]*d[2];
        const lz = m[8]*d[0] + m[9]*d[1] + m[10]*d[2];

        // d0 = (0,-1,0)  ->  cross(d0, l) = (-lz, 0, lx)
        let ax = -lz, ay = 0, az = lx;
        const dot = Math.max(-1, Math.min(1, -ly));
        let ang = Math.acos(dot);
        if (Math.hypot(ax, az) < 1e-6) {
            if (dot > 0) { ang = 0; ax = 0; az = 1; }      // sudah searah
            else { ang = Math.PI; ax = 0; az = 1; }          // berlawanan
        }
        this.axis = [ax, ay, az];
        this.angle = ang;
        this.MOVE_MATRIX = Mat.axisAngle(ax, ay, az, ang);
    }

    render(parentMatrix) {
        const GL = this.GL, L = this.locs;

        if (this.targetDir) this.aimAt(parentMatrix);

        // world = parent * POSITION (poros) * MOVE (rotasi di poros)
        const local = Mat.mul(this.POSITION_MATRIX, this.MOVE_MATRIX);
        const world = Mat.mul(parentMatrix, local);

        GL.uniformMatrix4fv(L.Mmatrix, false, new Float32Array(world));
        GL.uniform3fv(L.color, this.color);

        GL.bindBuffer(GL.ARRAY_BUFFER, this.vbo);
        GL.vertexAttribPointer(L.position, 3, GL.FLOAT, false, 24, 0);
        GL.vertexAttribPointer(L.normal,   3, GL.FLOAT, false, 24, 12);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.ibo);
        GL.drawElements(GL.TRIANGLES, this.count, GL.UNSIGNED_SHORT, 0);

        // child ikut transformasi parent
        this.childs.forEach(c => c.render(world));
    }
}