import { SubPointer } from "./PointerComponent";
import * as THREE from "three";
import Pointer from "./Pointer";
import State from "./State";
import {
  rotate,
  rotateStart,
  continuousZoomStart,
  continuousZoom,
} from "./Actions";

class PointerTwo extends Pointer {
  initialBetween: THREE.Vector2;
  between: THREE.Vector2;

  constructor(state: State) {
    super(state);
    this.between = new THREE.Vector2();
    this.initialBetween = new THREE.Vector2();
  }

  start(subPointers: Array<SubPointer>) {
    super.start(subPointers);
    this.subPointers = subPointers;
    const [p1, p2] = subPointers;

    this.current.copy(p1.current).add(p2.current).divideScalar(2);
    this.initial.copy(this.current);

    this.between.copy(p1.current).sub(p2.current);
    this.initialBetween.copy(this.between);

    this.diff.set(0, 0);

    rotateStart(this.state);
    continuousZoomStart(this.state);
  }

  move() {
    if (this.subPointers) {
      const [p1, p2] = this.subPointers;
      this.current.copy(p1.current).add(p2.current).divideScalar(2);

      this.between.copy(p1.current).sub(p2.current);

      this.diff.copy(this.current).sub(this.initial);

      rotate(this.state, this);
      continuousZoom(this.state, this);
    }
  }

  end() {
    super.end();
  }
}

export default PointerTwo;
