import * as Three from "three";
import State from "./State";

export class OutlineBox extends Three.InstancedMesh {
  state: State;
  material: THree.ShaderMaterial;

  constructor(state: State, cellSize: number, cols: number, rows: number) {
    const geometry = new Three.BoxBufferGeometry(
      cellSize,
      cellSize,
      cellSize / 4
    );

    geometry.setAttribute(
      "depth",
      new Three.InstancedBufferAttribute(
        new Float32Array(cols * rows),
        1,
        false
      )
    );

    const selected = Array(rows * cols).fill(0);
    geometry.setAttribute(
      "selected",
      new Three.InstancedBufferAttribute(new Float32Array(selected), 1, false)
    );

    const vertexShader = `
      attribute float depth;
      uniform float cellSize;
      attribute float selected;
      uniform vec3 color;

      void main() {
        vec3 depthed = position;
        depthed.z += depth * cellSize - cellSize / 2.0;
        vec4 pos = viewMatrix * modelMatrix * instanceMatrix * vec4(depthed, 1.0);
        gl_Position = projectionMatrix * pos * selected;
    }
    `;
    const fragmentShader = `
      uniform vec3 color;
      void main() {
        gl_FragColor = vec4(color, 1.0);
     }
   `;
    const uniforms = {
      cellSize: { value: cellSize },
      color: { value: new Three.Vector3(0.0, 1.0, 1.0) },
    };
    const material = new Three.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    super(geometry, material, cols * rows);
    this.material = material;
    state.highlightScene.add(this);
    this.state = state;

    const matrix = new Three.Matrix4();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        matrix.setPosition(
          (c + 0.5) * cellSize - (cols * cellSize) / 2,
          (r + 0.5) * cellSize - (rows * cellSize) / 2,
          0
        );
        const i = r * cols + c;
        this.setMatrixAt(i, matrix);
      }
    }
    this.updateDepth();
  }

  updateDepth() {
    for (let i = 0; i < this.state.heightGrid.length; i++) {
      const depth = this.state.heightGrid[i];
      // @ts-ignore
      this.geometry.attributes.depth.array[i] = depth;
    }
    this.geometry.attributes.depth.needsUpdate = true;
  }
}

export default OutlineBox;
