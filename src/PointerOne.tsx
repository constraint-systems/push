import { SubPointer } from "./PointerComponent";
import Pointer from "./Pointer";
import {
  areaSelectEnd,
  checkRayIntersect,
  checkSelected,
  clearSelected,
  deSelectAndRenderCells,
  panCamera,
  panCameraStart,
  pushPullSelected,
  renderSelected,
  rotate,
  rotateStart,
  selectAndRenderCells,
  toggleSelectAndRenderCells,
} from "./Actions";
import { SelectBox } from "./SelectBox";
import { SelectionBox } from "./SelectionBox";
import State from "./State";
import * as THREE from "three";

const areaSelectThreshold = 4;

class PointerOne extends Pointer {
  raycaster: THREE.Raycaster;
  clip: THREE.Vector3;
  clip2: THREE.Vector2;
  tempClip: THREE.Vector3;
  ray: THREE.Vector3;
  areaSelecting: boolean;
  pushPulling: boolean;
  selectIndexCache: null | number;
  startTime: number;
  selectBox: null | SelectBox;
  selectionBox: any;
  controlIndexCache: null | number;

  constructor(state: State) {
    super(state);
    this.clip = new THREE.Vector3();
    this.clip2 = new THREE.Vector2();
    this.tempClip = new THREE.Vector3();
    this.ray = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
    this.areaSelecting = false;
    this.pushPulling = false;
    this.selectBox = null;
    this.selectIndexCache = null;
    this.startTime = 0;
    this.selectionBox = new SelectionBox(this.state.camera, this.state.scene);
    this.controlIndexCache = null;
  }

  setRay() {
    this.clip.set(
      (this.current.x / window.innerWidth) * 2 - 1,
      -(this.current.y / window.innerHeight) * 2 + 1,
      0.5
    );
    this.clip2.set(this.clip.x, this.clip.y);
    this.tempClip.copy(this.clip);
    this.tempClip.unproject(this.state.camera);
    this.tempClip.sub(this.state.camera.position).normalize();
    const distance = (0 - this.state.camera.position.z) / this.tempClip.z;
    this.ray.copy(this.state.camera.position);
    this.ray.add(this.tempClip.multiplyScalar(distance));
  }

  start(subPointers: Array<SubPointer>) {
    super.start(subPointers);
    this.subPointers = subPointers;
    const [p1] = this.subPointers;
    this.initial.copy(p1.current);
    this.current.copy(p1.current);
    this.diff.set(0, 0);
    this.areaSelecting = false;
    this.pushPulling = false;
    this.startTime = Date.now();
    this.controlIndexCache = null;

    super.extras();

    const pressed = this.state.pressed;
    if (pressed.includes("d")) {
      panCameraStart(this.state);
    } else if (pressed.includes("v")) {
      this.state.view.mouse1.copy(this.current);
      this.state.view.mouse2.copy(this.current);
      this.state.view.update();
    } else if (pressed.includes("r")) {
      rotateStart(this.state);
    } else if (pressed.includes("control")) {
      this.setRay();
      const intersectIndex = checkRayIntersect(this);
      if (intersectIndex !== null) {
        toggleSelectAndRenderCells(this.state, this, intersectIndex);
      }
    } else {
      this.state.gridCache = this.state.selectedGrid.slice();
      // default
      this.setRay();
      const intersectIndex = checkRayIntersect(this);
      if (intersectIndex !== null) {
        const isSelected = checkSelected(this.state, intersectIndex);
        if (isSelected && !pressed.includes("shift")) {
          this.state.heightGridCache = this.state.heightGrid.slice();
          this.pushPulling = true;
        } else {
          if (!pressed.includes("shift")) clearSelected(this.state);
          this.selectIndexCache = intersectIndex;
          selectAndRenderCells(this.state, intersectIndex);
        }
      } else {
        if (!pressed.includes("shift")) clearSelected(this.state);
        renderSelected(this.state);
      }
    }
  }

  move() {
    if (this.active && this.subPointers) {
      const [p1] = this.subPointers;
      this.current.copy(p1.current);
      this.diff.copy(this.current).sub(this.initial);

      const pressed = this.state.pressed;
      if (pressed.includes("d")) {
        panCamera(this.state, this);
      } else if (pressed.includes("r")) {
        rotate(this.state, this);
      } else if (pressed.includes("v")) {
        this.state.view.mouse2.copy(this.current);
        this.state.view.update();
      } else if (pressed.includes("control")) {
        this.setRay();
        const intersectIndex = checkRayIntersect(this);
        if (intersectIndex !== null) {
          toggleSelectAndRenderCells(this.state, this, intersectIndex);
        }
      } else if (this.pushPulling) {
        pushPullSelected(this.state, this);
      } else {
        // default
        if (
          Math.abs(this.diff.x) > areaSelectThreshold ||
          Math.abs(this.diff.y) > areaSelectThreshold
        ) {
          if (!this.areaSelecting) {
            // start area select
            this.setRay();
            this.areaSelecting = true;
            this.selectBox = new SelectBox(
              this.state,
              this.initial,
              this.current
            );
            this.selectionBox.startPoint.copy(this.clip);
            deSelectAndRenderCells(this.state, this.selectIndexCache!);
          } else {
            // continue area select
            this.selectBox!.update(this.current);
            this.selectionBox.endPoint.copy(this.clip);
          }
        } else {
          if (this.areaSelecting) {
            this.areaSelecting = false;
            this.selectBox!.destroy();
            this.selectBox = null;
            selectAndRenderCells(this.state, this.selectIndexCache!);
          }
        }
      }

      super.extras();
    }
  }

  cancel() {
    this.pushPulling = false;
    if (this.areaSelecting) {
      this.areaSelecting = false;
      this.selectBox!.destroy();
    }
    this.active = false;
  }

  end() {
    this.pushPulling = false;
    if (this.areaSelecting) {
      this.areaSelecting = false;
      this.selectBox!.destroy();
      this.setRay();
      areaSelectEnd(this.state, this, this.selectionBox);
    }
    super.end();
    super.extras();
  }
}

export default PointerOne;
