import * as THREE from "three";
import State from "./State";
import Outline from "./Outline";
import Pointer from "./Pointer";
import Corners from "./Corners";
import PointerOne from "./PointerOne";
import { TsConfigSourceFile } from "typescript";

class ViewFinder {
  state: State;
  ray1: THREE.Vector3;
  ray2: THREE.Vector3;
  min: THREE.Vector3;
  max: THREE.Vector3;
  diff: THREE.Vector3;
  outline: Outline;
  group: THREE.Group;
  mesh: THREE.Mesh;
  initial: {
    ray1: THREE.Vector3;
    ray2: THREE.Vector3;
    diff: THREE.Vector3;
  };
  corners: Corners;
  mode: string;

  constructor(state: State, ray1: THREE.Vector3, ray2: THREE.Vector3) {
    this.ray1 = new THREE.Vector3().copy(ray1);
    this.ray2 = new THREE.Vector3().copy(ray2);
    this.min = new THREE.Vector3();
    this.max = new THREE.Vector3();
    this.diff = new THREE.Vector3();
    this.outline = new Outline(0xaaaaaa, 2, [
      window.innerWidth,
      window.innerHeight,
    ]);
    // this.corners = new CornerClass(MINOR_COLOR);
    const geometry = new THREE.PlaneGeometry();
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.initial = {
      ray1: new THREE.Vector3(),
      ray2: new THREE.Vector3(),
      diff: new THREE.Vector3(),
    };
    this.state = state;
    this.mode = "normal";

    this.corners = new Corners(state, 0xaaaaaa);

    this.group = new THREE.Group();
    this.group.add(this.mesh);
    this.group.add(this.outline);
    state.viewScene.add(this.group);

    this.corners.visible = false;

    this.update();
  }

  update() {
    this.min.copy(this.ray1).min(this.ray2);
    this.max.copy(this.ray1).max(this.ray2);
    this.diff.copy(this.max).sub(this.min);

    this.render();
    this.corners.update(this);
  }

  render() {
    this.group.scale.x = this.diff.x;
    this.group.scale.y = this.diff.y;
    this.group.position.x = this.min.x + this.diff.x / 2;
    this.group.position.y = this.min.y + this.diff.y / 2;
  }

  showCorners() {
    this.corners.visible = true;
  }
  hideCorners() {
    this.corners.visible = false;
  }

  pointerOneDown(pointer: PointerOne) {
    const cornerIntersects = pointer.raycaster.intersectObjects(
      this.corners.children
    );
    if (cornerIntersects.length > 0) {
      this.mode = "resizing";
      const toPin = cornerIntersects[0].object.userData.corner;
      //@ts-ignore
      this.ray1.x = this[toPin[0]].x;
      //@ts-ignore
      this.ray1.y = this[toPin[1]].y;
    } else {
      const meshIntersect = pointer.raycaster.intersectObject(this.mesh);
      if (meshIntersect.length) {
        this.mode = "moving";
        this.initial.ray1.copy(this.min);
        this.initial.ray2.copy(this.max);
        this.initial.diff.copy(this.diff);
      } else {
        this.mode = "drawing";
        this.ray1.copy(pointer.ray);
        this.ray2.copy(pointer.ray);
      }
    }
  }

  pointerOneMove(pointer: PointerOne) {
    switch (this.mode) {
      case "moving":
        const visibleHeight =
          2 *
          Math.tan((this.state.camera.fov * Math.PI) / 360) *
          this.state.camera.position.z;
        const zoomPixel = visibleHeight / window.innerHeight;
        this.ray1.x = this.initial.ray1.x + pointer.diff.x * zoomPixel;
        this.ray1.y = this.initial.ray1.y - pointer.diff.y * zoomPixel;
        this.ray2.x = this.initial.ray2.x + pointer.diff.x * zoomPixel;
        this.ray2.y = this.initial.ray2.y - pointer.diff.y * zoomPixel;
        break;
      case "resizing":
        this.ray2.x = pointer.ray.x;
        this.ray2.y = pointer.ray.y;
        break;
      case "drawing":
        this.ray2.copy(pointer.ray);
        break;
      default:
    }
    this.update();
  }

  wheel(change: number) {
    // TODO preserve aspect ratio
    const percent = (window.innerHeight - change) / window.innerHeight;
    const newDiffX = this.diff.x * percent;
    const newDiffY = this.diff.y * percent;
    const centerX = this.min.x + this.diff.x / 2;
    const centerY = this.min.y + this.diff.y / 2;
    this.ray1.x = centerX - newDiffX / 2;
    this.ray1.y = centerY - newDiffY / 2;
    this.ray2.x = centerX + newDiffX / 2;
    this.ray2.y = centerY + newDiffY / 2;
    this.update();
  }

  end() {
    this.mode = "normal";
  }
}

export default ViewFinder;
