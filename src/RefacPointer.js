import { useEffect } from "react";
import State, { Mode } from "./State";
import * as Three from "three";
// import {
//   checkRayIntersect,
//   getBoxIntersect,
//   getSelected,
//   raySelect,
// } from "./Actions";
import { SelectBox } from "./SelectBox";
import { SelectionBox } from "./SelectionBox";

export class Pointer {
  id: number;
  dragging: boolean;
  state: State;
  initial: Three.Vector2;
  current: Three.Vector2;
  previous: Three.Vector2;
  clip: Three.Vector3;
  clip2: Three.Vector2;
  tempClip: Three.Vector3;
  ray: Three.Vector3;
  center: Three.Vector3;
  raycaster: Three.Raycaster;
  zoomRay: Three.Vector3;
  selectBox: null | SelectBox;
  selectionBox: any;
  heightGridCache: Array<number>;

  constructor(state: State, e: PointerEvent) {
    this.id = e.pointerId;

    // position
    this.current = new Three.Vector2();
    this.clip = new Three.Vector3();
    this.clip2 = new Three.Vector2();
    this.tempClip = new Three.Vector3();
    this.ray = new Three.Vector3();
    this.raycaster = new Three.Raycaster();
    this.zoomRay = new Three.Vector3();
    this.previous = new Three.Vector2();
    this.center = new Three.Vector3();
    this.initial = new Three.Vector2();
    this.dragging = false;
    this.selectBox = null;
    this.selectBox = null;
    this.state = state;
    this.selectionBox = new SelectionBox(this.state.camera, this.state.scene);
    this.heightGridCache = state.heightGrid.slice();
  }

  move(e: PointerEvent) {
    // update position
    const x = e.clientX;
    const y = e.clientY;
    const camera = this.state.camera;
    this.current.set(x, y);
    const forClipX = (this.current.x / window.innerWidth) * 2 - 1;
    const forClipY = -(this.current.y / window.innerHeight) * 2 + 1;
    this.clip.set(forClipX, forClipY, 0.5);
    this.clip2.set(forClipX, forClipY);
    this.tempClip.copy(this.clip);
    this.tempClip.unproject(camera);
    this.tempClip.sub(camera.position).normalize();
    const distance = (0 - camera.position.z) / this.tempClip.z;
    this.ray.copy(camera.position);
    this.ray.add(this.tempClip.multiplyScalar(distance));
    // this.raycaster.setFromCamera(this.clip2, camera);

    if (this.dragging) {
      this.drag(e);
    } else {
      this.hover(e);
    }
  }

  hover(e: PointerEvent) {
    // for (const box of this.state.boxes) {
    //   box.setColor(0xff0000);
    // }
    // const highlightedBox = getBoxIntersect(this.state.boxes, this.raycaster);
    // if (highlightedBox)
    //   highlightedBox.setColor(0x00ff00);
    // }
  }

  zoom(e: Event) {
    const change = ((e as WheelEvent).deltaY > 0 ? 1 : -1) * 16;
    if (!(e as WheelEvent).ctrlKey) {
      const sign = change > 0 ? 1 : -1;
      for (let i = 0; i < this.state.selectedGrid.length; i++) {
        if (this.state.selectedGrid[i]) {
          this.state.heightGrid[i] -= sign;
          this.state.heightGrid[i] = Math.min(
            Math.max(1, this.state.heightGrid[i]),
            this.state.depth
          );
        }
      }
      const visibleBuffer =
        // @ts-ignore
        this.state.group.geometry.attributes.visible.array;
      for (let i = 0; i < this.state.heightGrid.length; i++) {
        const height = this.state.heightGrid[i];
        const row = Math.floor(i / this.state.cols);
        const col = i % this.state.cols;
        for (let d = 0; d < this.state.depth; d++) {
          visibleBuffer[
            row * this.state.cols * this.state.depth +
              col * this.state.depth +
              d
          ] = d < height ? 1 : 0;
        }
      }
      // @ts-ignore
      this.state.group.geometry.attributes.visible.needsUpdate = true;
    } else {
      e.preventDefault();
      const percent =
        (window.innerHeight + Math.min(change, 16) * 2) / window.innerHeight;
      this.state.camera.position.z *= percent;
    }
  }

  dragStart(e: PointerEvent) {
    // make sure mobile has event
    this.move(e);
    this.previous.copy(this.current);
    this.initial.copy(this.current);
    this.dragging = true;
    switch (this.state.mode) {
      case Mode.Rotate:
        break;
      case Mode.Zoom:
        break;
      case Mode.PaintSelect:
        break;
      case Mode.Move:
        break;
      case Mode.PushPull:
        break;
      case Mode.AreaSelect:
        break;
      case Mode.Normal:
        const selectedIntersect = checkRayIntersect(this);
        if (selectedIntersect) {
          this.state.setMode(Mode.PushPull);
          this.heightGridCache = this.state.heightGrid.slice();
        } else {
          this.state.setMode(Mode.AreaSelect);

          // default
          const selectedBuffer =
            // @ts-ignore
            this.state.group.geometry.attributes.selected.array;

          selectedBuffer.fill(0);
          this.state.selectedGrid.fill(0);

          this.selectBox = new SelectBox(
            this.state,
            this.current,
            this.current
          );
          this.selectionBox.startPoint.copy(this.clip);
        }
        break;
      default:
    }
  }

  drag(e: PointerEvent) {
    const deltaX = this.current.x - this.previous.x;
    const deltaY = this.current.y - this.previous.y;
    if (this.state.mode === Mode.Rotate) {
      this.state.group.rotation.y += deltaX * this.state.worldPixel;
      this.state.group.rotation.x += deltaY * this.state.worldPixel;
    } else if (this.state.mode === Mode.Zoom) {
      const percent = (window.innerHeight + deltaY * 2) / window.innerHeight;
      this.state.camera.position.z /= percent;
    } else if (this.state.mode === Mode.Move) {
      const visibleHeight =
        2 *
        Math.tan((this.state.camera.fov * Math.PI) / 360) *
        this.state.camera.position.z;
      const zoomPixel = visibleHeight / window.innerHeight;
      this.state.cameraOffset.x = -deltaX * zoomPixel;
      this.state.cameraOffset.y = deltaY * zoomPixel;
      this.state.camera.position.x += this.state.cameraOffset.x;
      this.state.camera.position.y += this.state.cameraOffset.y;
      this.state.center.x += deltaX * this.state.cameraOffset.x;
      this.state.center.y += deltaY * this.state.cameraOffset.y;
    } else if (e.shiftKey) {
      // paint select
      raySelect(this);
    } else if (this.state.mode === Mode.PushPull) {
      const diff = Math.round((this.current.y - this.initial.y) / 8);
      for (let i = 0; i < this.state.selectedGrid.length; i++) {
        if (this.state.selectedGrid[i]) {
          this.state.heightGrid[i] = Math.min(
            Math.max(1, this.heightGridCache[i] + diff),
            this.state.depth
          );
        }
      }
      const visibleBuffer =
        // @ts-ignore
        this.state.group.geometry.attributes.visible.array;
      for (let i = 0; i < this.state.heightGrid.length; i++) {
        const height = this.state.heightGrid[i];
        const row = Math.floor(i / this.state.cols);
        const col = i % this.state.cols;
        for (let d = 0; d < this.state.depth; d++) {
          visibleBuffer[
            row * this.state.cols * this.state.depth +
              col * this.state.depth +
              d
          ] = d < height ? 1 : 0;
        }
      }
      // @ts-ignore
      this.state.group.geometry.attributes.visible.needsUpdate = true;
    } else if (this.state.mode === Mode.AreaSelect) {
      this.selectBox!.update(this.current);
      this.selectionBox.endPoint.copy(this.clip);
    }
    this.previous.copy(this.current);
  }

  dragEnd(e: PointerEvent) {
    this.dragging = false;
    if (this.state.mode === Mode.PushPull) {
      this.state.setMode(Mode.Normal);
    }

    if (this.selectBox) {
      if (this.state.mode === Mode.AreaSelect) {
        this.state.setMode(Mode.Normal);
      }
      this.selectBox.destroy();
      this.selectBox = null;

      const diffX = this.current.x - this.initial.x;
      const diffY = this.current.y - this.initial.y;

      const selectedBuffer =
        // @ts-ignore
        this.state.group.geometry.attributes.selected.array;
      const visBuffer =
        // @ts-ignore
        this.state.group.geometry.attributes.visible.array;

      if (!(Math.abs(diffX) > 4 || Math.abs(diffY) > 4)) {
        selectedBuffer.fill(0);
        this.state.selectedGrid.fill(0);
        raySelect(this);
      } else {
        this.selectionBox.endPoint.copy(this.clip);
        this.selectionBox.select();
        const indexes = this.selectionBox.instances[this.state.group.uuid];

        // deselect
        selectedBuffer.fill(0);
        this.state.selectedGrid.fill(0);

        let maxDepth = 0;
        let possibilities = [];
        for (const index of indexes) {
          // @ts-ignore
          if (visBuffer[index]) {
            // @ts-ignore
            const allCols = Math.floor(index / this.state.depth);
            const row = Math.floor(allCols / this.state.cols);
            const col = allCols % this.state.cols;
            const depth =
              index %
              (row * this.state.cols * this.state.depth +
                col * this.state.depth);
            if (
              depth ===
              this.state.heightGrid[row * this.state.cols + col] - 1
            ) {
              maxDepth = Math.max(maxDepth, depth);
              // depth, grid index
              possibilities.push([depth, row * this.state.cols + col]);
            }
          }
        }
        for (const possibility of possibilities) {
          if (possibility[0] === maxDepth) {
            this.state.selectedGrid[possibility[1]] = 1;
          }
        }
        for (let i = 0; i < this.state.selectedGrid.length; i++) {
          if (this.state.selectedGrid[i]) {
            const row = Math.floor(i / this.state.cols);
            const col = i % this.state.cols;
            for (let d = 0; d < this.state.depth; d++) {
              selectedBuffer[
                row * this.state.cols * this.state.depth +
                  col * this.state.depth +
                  d
              ] = 1;
            }
          }
        }
        // @ts-ignore
        this.state.group.geometry.attributes.selected.needsUpdate = true;
      }
    }
  }
}

type PointerProps = {
  state: State;
};

const PointerComponent = ({ state }: PointerProps) => {
  useEffect(() => {
    const { canvas } = state;

    const getPointerIndex = (id: number) => {
      const pointers = state.pointers;
      const ids = pointers.map((p) => p.id);
      return ids.indexOf(id);
    };

    const getOrCreatePointer = (e: PointerEvent) => {
      const index = getPointerIndex(e.pointerId);
      let pointer;
      if (index === -1) {
        pointer = new Pointer(state, e);
        state.pointers.push(pointer);
      } else {
        pointer = state.pointers[index];
      }
      return pointer;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const pointer = getOrCreatePointer(e);
      console.log(state.pointers);
      pointer.move(e);
    };

    const handlePointerDown = (e: PointerEvent) => {
      const pointer = getOrCreatePointer(e);
      pointer.dragStart(e);
      console.log(state.pointers);
      state.canvas!.setPointerCapture(e.pointerId);
    };

    const handlePointerUp = (e: PointerEvent) => {
      const pointer = getOrCreatePointer(e);
      pointer.dragEnd(e);
      state.canvas.releasePointerCapture(e.pointerId);
    };

    const handleMousewheel = (e: Event) => {
      const pointer = getOrCreatePointer(e as PointerEvent);
      pointer.zoom(e);
    };

    if (canvas) {
      canvas.addEventListener("pointerdown", handlePointerDown);
      canvas.addEventListener("pointermove", handlePointerMove);
      canvas.addEventListener("pointerup", handlePointerUp);
      canvas.addEventListener("pointercancel", handlePointerUp);
      canvas.addEventListener("mousewheel", handleMousewheel, {
        passive: false,
      });
      return () => {
        canvas.removeEventListener("pointerdown", handlePointerDown);
        canvas.removeEventListener("pointermove", handlePointerMove);
        canvas.removeEventListener("pointerup", handlePointerUp);
        canvas.removeEventListener("pointercancel", handlePointerUp);
        canvas.removeEventListener("mousewheel", handleMousewheel);
      };
    }
  }, []);

  return null;
};

export default PointerComponent;
