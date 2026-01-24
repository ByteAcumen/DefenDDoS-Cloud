declare module 'three' {
    export class Vector3 {
        constructor(x?: number, y?: number, z?: number);
        x: number;
        y: number;
        z: number;
    }

    export class Object3D {
        rotation: { x: number; y: number; z: number };
        scale: { setScalar(s: number): void; x: number; y: number; z: number };
        position: Vector3;
    }

    export class Mesh extends Object3D {
        material: any;
    }

    export class Points extends Object3D { }

    export class LineBasicMaterial {
        opacity: number;
    }

    export const BackSide: number;

    export class SphereGeometry { }
    export class BufferGeometry { }
    export class BufferAttribute { }
}

declare module 'three/examples/jsm/controls/OrbitControls' {
    export class OrbitControls { }
}
