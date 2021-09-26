import * as THREE from "three";
import { panCameraStart, panCamera, rotate, rotateStart } from "./Actions";
import State from "./State";
import { SubPointer } from "./PointerComponent";

class PointerHover {
  active: boolean;
  initial: THREE.Vector2;
  current: THREE.Vector2;
  diff: THREE.Vector2;
  state: State;
  spacePointer: null | SubPointer;

  constructor(state: State) {
    this.active = false;
    this.initial = new THREE.Vector2();
    this.current = new THREE.Vector2();
    this.diff = new THREE.Vector2();
    this.state = state;
    this.spacePointer = null;
  }

  start(x: number, y: number) {
    this.active = true;
    this.current.set(x, y);
    this.initial.copy(this.current);
    this.diff.set(0, 0);

    const pressed = this.state.pressed;
    if (pressed.includes(" ")) {
      this.spacePointer = new SubPointer(this.state, {
        pointerId: 999,
        clientX: this.current.x,
        clientY: this.current.y,
      });
    } else if (pressed.includes("r")) {
      rotateStart(this.state);
    } else if (pressed.includes("d")) {
      panCameraStart(this.state);
    }
  }

  move(x: number, y: number) {
    this.current.set(x, y);
    this.diff.copy(this.current).sub(this.initial);
    const pressed = this.state.pressed;
    if (pressed.includes("r")) {
      rotate(this.state, this);
    } else if (pressed.includes("d")) {
      panCamera(this.state, this);
    }
  }

  end() {
    this.active = false;
    this.current.set(0, 0);
    this.diff.set(0, 0);
  }
}

export default PointerHover;
