import * as THREE from "three";
import State from "./State";
import ViewFinder from "./ViewFinder";

class Corners extends THREE.Group {
  constructor(state: State, color: number) {
    super();
    const cornerPins = [
      ["max", "max"],
      ["min", "max"],
      ["max", "min"],
      ["min", "min"],
    ];
    const worldPixel = state.worldPixel;
    const size = 16 * worldPixel;
    for (let i = 0; i < 4; i++) {
      const geometry = new THREE.PlaneGeometry(size, size);
      const material = new THREE.MeshBasicMaterial({ color: color });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.corner = cornerPins[i];
      this.add(mesh);
    }
    state.viewScene.add(this);
  }

  update(box: ViewFinder) {
    this.children[0].position.x = box.min.x;
    this.children[0].position.y = box.min.y;
    this.children[1].position.x = box.max.x;
    this.children[1].position.y = box.min.y;
    this.children[2].position.x = box.min.x;
    this.children[2].position.y = box.max.y;
    this.children[3].position.x = box.max.x;
    this.children[3].position.y = box.max.y;
  }
}

export default Corners;
