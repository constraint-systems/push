import * as THREE from "three";
// @ts-ignore
import { Line2 } from "../node_modules/three/examples/jsm/lines/Line2.js";
// @ts-ignore
import { LineMaterial } from "../node_modules/three/examples/jsm/lines/LineMaterial.js";
// @ts-ignore
import { LineGeometry } from "../node_modules/three/examples/jsm/lines/LineGeometry";

class Outline extends THREE.Group {
  linewidth: number;

  constructor(color: number, linewidth: number, resolution: Array<number>) {
    super();
    const geometry = new LineGeometry();
    geometry.setPositions([
      -0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0, -0.5, -0.5, 0,
      0.5, -0.5, 0,
    ]);
    this.linewidth = linewidth;
    const material = new LineMaterial({
      color,
      linewidth,
    });
    material.resolution.set(...resolution);
    const line = new Line2(geometry, material);
    line.computeLineDistances();
    line.scale.set(1, 1, 1);
    this.add(line);
  }

  setColor(color: number) {
    // @ts-ignore
    this.children[0].material.color.setHex(color);
  }
}

export default Outline;
