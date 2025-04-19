class Matrix4 {
    constructor() {
        this.data = new Float32Array(16);
        this.identity();
    }

    identity() {
        this.data.set([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        return this;
    }

    multiply(matrix) {
        const a = this.data;
        const b = matrix.data;
        const result = new Float32Array(16);

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                result[row * 4 + col] =
                    a[row * 4 + 0] * b[0 * 4 + col] +
                    a[row * 4 + 1] * b[1 * 4 + col] +
                    a[row * 4 + 2] * b[2 * 4 + col] +
                    a[row * 4 + 3] * b[3 * 4 + col];
            }
        }

        this.data.set(result);
        return this;
    }

    translate(x, y, z) {
        const translation = new Matrix4();
        translation.data.set([
            1, 0, 0, x,
            0, 1, 0, y,
            0, 0, 1, z,
            0, 0, 0, 1
        ]);
        return this.multiply(translation);
    }

    scale(x, y, z) {
        const scaling = new Matrix4();
        scaling.data.set([
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1
        ]);
        return this.multiply(scaling);
    }

    rotateX(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const rotation = new Matrix4();
        rotation.data.set([
            1, 0, 0, 0,
            0, c, -s, 0,
            0, s, c, 0,
            0, 0, 0, 1
        ]);
        return this.multiply(rotation);
    }

    rotateY(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const rotation = new Matrix4();
        rotation.data.set([
            c, 0, s, 0,
            0, 1, 0, 0,
            -s, 0, c, 0,
            0, 0, 0, 1
        ]);
        return this.multiply(rotation);
    }

    rotateZ(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const rotation = new Matrix4();
        rotation.data.set([
            c, -s, 0, 0,
            s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        return this.multiply(rotation);
    }

    transform(vector3) {
        return new Vector3(
            this.data[0] * vector3.x + this.data[4] * vector3.y + this.data[8] * vector3.z + this.data[12],
            this.data[1] * vector3.x + this.data[5] * vector3.y + this.data[9] * vector3.z + this.data[13],
            this.data[2] * vector3.x + this.data[6] * vector3.y + this.data[10] * vector3.z + this.data[14]
        );
    }

}