import { SubPointer } from "./PointerComponent";
import Pointer from "./Pointer";
import { panCamera, panCameraStart } from "./Actions";

// no between because it gets complicated
class PointerThree extends Pointer {
  start(subPointers: Array<SubPointer>) {
    this.active = true;
    this.subPointers = subPointers;
    const [p1, p2, p3] = subPointers;

    this.current
      .copy(p1.current)
      .add(p2.current)
      .add(p3.current)
      .divideScalar(3);
    this.initial.copy(this.current);

    this.diff.set(0, 0);

    panCameraStart(this.state);
  }

  move() {
    if (this.subPointers) {
      const [p1, p2, p3] = this.subPointers;
      this.current
        .copy(p1.current)
        .add(p2.current)
        .add(p3.current)
        .divideScalar(3);

      this.diff.copy(this.current).sub(this.initial);

      panCamera(this.state, this);
    }
  }

  end() {
    super.end();
  }
}

export default PointerThree;
