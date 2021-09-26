import * as Three from "three";
import State from "./State";

export class Box extends Three.InstancedMesh {
  selected: boolean;

  constructor(
    state: State,
    cellSize: number,
    cols: number,
    rows: number,
    depth: number,
    texture: Three.Texture
  ) {
    const geometry = new Three.BoxBufferGeometry(cellSize, cellSize, cellSize);

    var uv = geometry.getAttribute("uv");

    // +x
    uv.setXY(0, 1, 1);
    uv.setXY(1, 1, 1);
    uv.setXY(2, 1, 0);
    uv.setXY(3, 1, 0);

    // -x
    uv.setXY(4, 0, 1);
    uv.setXY(5, 0, 1);
    uv.setXY(6, 0, 0);
    uv.setXY(7, 0, 0);

    // +y
    uv.setXY(8, 0, 1);
    uv.setXY(9, 1, 1);
    uv.setXY(10, 0, 1);
    uv.setXY(11, 1, 1);

    // -y
    uv.setXY(12, 0, 0);
    uv.setXY(13, 1, 0);
    uv.setXY(14, 0, 0);
    uv.setXY(15, 1, 0);

    // z
    uv.setXY(16, 0, 1);
    uv.setXY(17, 1, 1);
    uv.setXY(18, 0, 0);
    uv.setXY(15, 1, 0);

    // -z
    uv.setXY(20, 0, 0);
    uv.setXY(21, 0, 0);
    uv.setXY(22, 0, 0);
    uv.setXY(23, 0, 0);

    const texScale = [1 / cols, 1 / rows];
    const offsets = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        for (let d = 0; d < depth; d++) {
          offsets.push(c, r);
        }
      }
    }
    geometry.setAttribute(
      "offset",
      new Three.InstancedBufferAttribute(new Float32Array(offsets), 2, false)
    );

    const visible = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        for (let d = 0; d < depth; d++) {
          visible.push(d === 0 ? 1 : 0);
          // visible.push(1);
        }
      }
    }
    geometry.setAttribute(
      "visible",
      new Three.InstancedBufferAttribute(new Float32Array(visible), 1, false)
    );

    // const selected = Array(rows * cols * depth).fill(0);
    // geometry.setAttribute(
    //   "selected",
    //   new Three.InstancedBufferAttribute(new Float32Array(selected), 1, false)
    // );

    const vertexShader = `
      varying vec2 vUv;
      attribute vec2 offset;
      varying vec2 vOffset;
      uniform vec2 texScale;
      varying vec2 vTexScale;
      attribute float visible;

      void main() {
        vUv = uv * texScale;
        vOffset = offset * texScale;
        vTexScale = texScale;

        gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0) * visible;
      }
    `;
    const fragmentShader = `
      uniform sampler2D texture1;
      varying vec2 vUv;
      varying vec2 vOffset;
      varying vec2 vTexScale;

      void main() {
         vec4 color = texture2D(texture1, vec2(vUv.x + vOffset.x, vUv.y + vOffset.y));
        color.a = 1.0;
         gl_FragColor = color;
      }
    `;

    var uniforms = {
      texture1: { type: "t", value: texture },
      texScale: { value: texScale },
    };

    const material = new Three.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });
    super(geometry, material, cols * rows * depth);
    const matrix = new Three.Matrix4();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        for (let d = 0; d < depth; d++) {
          matrix.setPosition(
            (c + 0.5) * cellSize - (cols * cellSize) / 2,
            (r + 0.5) * cellSize - (rows * cellSize) / 2,
            d * cellSize
          );
          const i = r * cols * depth + c * depth + d;
          this.setMatrixAt(i, matrix);
        }
      }
    }
    state.scene.add(this);
  }
}
