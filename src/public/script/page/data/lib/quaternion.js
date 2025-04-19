class Quaternion {
    
    constructor(i, j, k, w) {
        this.i = i || 0;
        this.j = j || 0;
        this.k = k || 0;
        this.w = w || 1;
    }

    multiply(q) {
        const i = this.i * q.w + this.j * q.k - this.k * q.j + this.w * q.i;
        const j = -this.i * q.k + this.j * q.w + this.k * q.i + this.w * q.j;
        const k = this.i * q.j - this.j * q.i + this.k * q.w + this.w * q.k;
        const w = -this.i * q.i - this.j * q.j - this.k * q.k + this.w * q.w;
        return new Quaternion(i, j, k, w);
    }

    rotateX(angle) {
        const halfAngle = angle / 2;
        const sinHalfAngle = Math.sin(halfAngle);
        return new Quaternion(sinHalfAngle, 0, 0, Math.cos(halfAngle)).multiply(this);
    }

    rotateY(angle) {
        const halfAngle = angle / 2;
        const sinHalfAngle = Math.sin(halfAngle);
        return new Quaternion(0, sinHalfAngle, 0, Math.cos(halfAngle)).multiply(this);
    }

    rotateZ(angle) {
        const halfAngle = angle / 2;
        const sinHalfAngle = Math.sin(halfAngle);
        return new Quaternion(0, 0, sinHalfAngle, Math.cos(halfAngle)).multiply(this);
    }

    rotateAxis(angle, x, y, z) {
        const halfAngle = angle / 2;
        const sinHalfAngle = Math.sin(halfAngle);
        return new Quaternion(x * sinHalfAngle, y * sinHalfAngle, z * sinHalfAngle, Math.cos(halfAngle)).multiply(this);
    }
    
}