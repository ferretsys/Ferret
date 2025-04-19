class Vector3 {
    
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    static add(v1, v2) {
        return new Vector3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
    }

    static subtract(v1, v2) {
        return new Vector3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
    }

    static multiply(v, scalar) {
        return new Vector3(v.x * scalar, v.y * scalar, v.z * scalar);
    }

    static divide(v, scalar) {
        return new Vector3(v.x / scalar, v.y / scalar, v.z / scalar);
    }

}