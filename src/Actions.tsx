// import * as THREE from "three";
import PointerOne from "./PointerOne";
import Pointer from "./Pointer";
import State from "./State";
import PointerTwo from "./PointerTwo";
import { SelectionBox } from "./SelectionBox";

export const checkRayIntersect = (pointer: PointerOne) => {
  // @ts-ignore
  const visBuffer = pointer.state.group.geometry.attributes.visible.array;
  pointer.raycaster.setFromCamera(pointer.clip2, pointer.state.camera);
  const intersected = pointer.raycaster.intersectObject(pointer.state.group);
  for (const intersect of intersected) {
    const index = intersect.instanceId!;
    if (visBuffer[index]) {
      return index;
    }
  }
  return null;
};

export const getStackGridIndexFromInstanceIndex = (
  state: State,
  index: number
) => {
  const allCols = Math.floor(index / state.depth);
  const row = Math.floor(allCols / state.cols);
  const col = allCols % state.cols;
  return row * state.cols + col;
};

export const selectGridIndex = (state: State, index: number) => {
  state.selectedGrid[index] = 1;
};

export const deSelectGridIndex = (state: State, index: number) => {
  state.selectedGrid[index] = 0;
};

export const clearSelected = (state: State) => {
  state.selectedGrid.fill(0);
};

export const renderSelected = (state: State) => {
  // @ts-ignore
  const selectedBuffer = state.outlineBoxes.geometry.attributes.selected.array;

  for (let i = 0; i < state.selectedGrid.length; i++) {
    const val = state.selectedGrid[i];
    selectedBuffer[i] = val;
  }
  // @ts-ignore
  state.outlineBoxes.geometry.attributes.selected.needsUpdate = true;
};

export const selectAndRenderCells = (state: State, index: number) => {
  const gridIndex = getStackGridIndexFromInstanceIndex(state, index);
  selectGridIndex(state, gridIndex);
  renderSelected(state);
};

export const deSelectAndRenderCells = (state: State, index: number) => {
  const gridIndex = getStackGridIndexFromInstanceIndex(state, index);
  deSelectGridIndex(state, gridIndex);
  renderSelected(state);
};

export const toggleSelectAndRenderCells = (
  state: State,
  pointer: PointerOne,
  index: number
) => {
  const gridIndex = getStackGridIndexFromInstanceIndex(state, index);
  if (pointer.controlIndexCache !== gridIndex) {
    state.selectedGrid[gridIndex] = state.selectedGrid[gridIndex] === 0 ? 1 : 0;
    renderSelected(state);
    pointer.controlIndexCache = gridIndex;
  }
};

export const panCameraStart = (state: State) => {
  state.initialCameraPosition.copy(state.camera.position);
};

export const panCamera = (state: State, pointer: Pointer) => {
  const visibleHeight =
    2 * Math.tan((state.camera.fov * Math.PI) / 360) * state.camera.position.z;
  const zoomPixel = visibleHeight / window.innerHeight;
  state.camera.position.x =
    state.initialCameraPosition.x - pointer.diff.x * zoomPixel;
  state.camera.position.y =
    state.initialCameraPosition.y + pointer.diff.y * zoomPixel;
};

export const discretePanCamera = (state: State, diff: Array<number>) => {
  const visibleHeight =
    2 * Math.tan((state.camera.fov * Math.PI) / 360) * state.camera.position.z;
  const zoomPixel = visibleHeight / window.innerHeight;
  state.camera.position.x -= 16 * diff[0] * zoomPixel;
  state.camera.position.y += 16 * diff[1] * zoomPixel;
};

export const interruptPointerKeyDown = (state: State, press: string) => {
  // pointerOne interrupts
  if (state.keyInterupts.includes(press)) {
    if (state.PointerOne.active) {
      state.PointerOne.end();
      state.PointerOne.start(state.PointerOne.subPointers!);
    }
  }
  if (state.hoverKeyInterrupts.includes(press)) {
    if (state.PointerHover.active) {
      state.PointerHover.start(
        state.PointerHover.current.x,
        state.PointerHover.current.y
      );
    }
  }
};

export const interruptPointerKeyUp = (state: State, press: string) => {
  if (state.keyInterupts.includes(press)) {
    if (state.PointerOne.active) {
      const index = state.pressed.indexOf(press);
      if (index !== -1) {
        state.pressed.splice(index, 1);
      }
      state.PointerOne.end();
      state.PointerOne.start(state.PointerOne.subPointers!);
    }
  }
  if (state.hoverKeyInterrupts.includes(press)) {
    if (state.PointerHover.active) {
      state.PointerHover.start(
        state.PointerHover.current.x,
        state.PointerHover.current.y
      );
    }
  }
};

export const rotateStart = (state: State) => {
  state.initialRotation.copy(state.group.rotation);
};

export const rotate = (state: State, pointer: Pointer) => {
  const rotateY = Math.min(
    Math.PI / 2,
    Math.max(
      -Math.PI / 2,
      state.initialRotation.y + pointer.diff.x * state.worldPixel
    )
  );
  const rotateX = Math.min(
    Math.PI / 2,
    Math.max(
      -Math.PI / 2,
      state.initialRotation.x + pointer.diff.y * state.worldPixel
    )
  );
  state.group.rotation.x = rotateX;
  state.outlineBoxes.rotation.x = rotateX;
  state.group.rotation.y = rotateY;
  state.outlineBoxes.rotation.y = rotateY;
};

export const boundZoom = (state: State, val: number) => {
  const min = state.camera.near + 0.1;
  const max = state.camera.far - 0.1;
  return Math.min(max, Math.max(min, val));
};

export const continuousZoomStart = (state: State) => {
  state.initialCameraPosition.copy(state.camera.position);
};

export const continuousZoom = (state: State, pointer: PointerTwo) => {
  const initialRadius = Math.sqrt(
    pointer.initialBetween.x * pointer.initialBetween.x +
      pointer.initialBetween.y * pointer.initialBetween.y
  );
  const radius = Math.sqrt(
    pointer.between.x * pointer.between.x +
      pointer.between.y * pointer.between.y
  );
  const percent =
    (window.innerHeight + (radius - initialRadius) * 2) / window.innerHeight;
  state.camera.position.z = boundZoom(
    state,
    state.initialCameraPosition.z / percent
  );
};

export const discreteZoom = (state: State, change: number) => {
  const percent = (window.innerHeight - change) / window.innerHeight;
  state.camera.position.z = boundZoom(state, state.camera.position.z / percent);
};

export const checkSelected = (state: State, index: number) => {
  const stackIndex = getStackGridIndexFromInstanceIndex(state, index);
  return state.selectedGrid[stackIndex];
};

export const areaSelectEnd = (
  state: State,
  pointer: PointerOne,
  selectionBox: SelectionBox
) => {
  selectionBox.endPoint.copy(pointer.clip);
  selectionBox.select();
  // @ts-ignore
  const visBuffer = pointer.state.group.geometry.attributes.visible.array;
  // @ts-ignore
  const indexes = selectionBox.instances[state.group.uuid];

  let maxDepth = 0;
  let possibilities = [];
  for (const index of indexes) {
    // @ts-ignore
    if (visBuffer[index]) {
      // @ts-ignore
      const allCols = Math.floor(index / state.depth);
      const row = Math.floor(allCols / state.cols);
      const col = allCols % state.cols;
      let depth;
      if (index < state.depth) {
        depth = index;
      } else {
        depth = index % (row * state.cols * state.depth + col * state.depth);
      }
      if (depth === state.heightGrid[row * state.cols + col] - 1) {
        maxDepth = Math.max(maxDepth, depth);
        // depth, grid index
        possibilities.push([depth, row * state.cols + col]);
      }
    }
  }
  for (const possibility of possibilities) {
    if (possibility[0] === maxDepth) {
      state.selectedGrid[possibility[1]] = 1;
    }
  }
  renderSelected(state);
};

export const pushPullSelected = (state: State, pointer: Pointer) => {
  const visibleBuffer =
    // @ts-ignore
    state.group.geometry.attributes.visible.array;
  for (let i = 0; i < state.selectedGrid.length; i++) {
    const isSelected = state.selectedGrid[i];
    if (isSelected) {
      state.heightGrid[i] = Math.max(
        1,
        Math.min(
          state.depth,
          state.heightGridCache[i] + Math.round(pointer.diff.y / 8)
        )
      );
      const height = state.heightGrid[i];
      const row = Math.floor(i / state.cols);
      const col = i % state.cols;
      for (let d = 0; d < state.depth; d++) {
        visibleBuffer[row * state.cols * state.depth + col * state.depth + d] =
          d < height ? 1 : 0;
      }
    }
  }
  // @ts-ignore
  state.group.geometry.attributes.visible.needsUpdate = true;
  // @ts-ignore
  state.outlineBoxes.updateDepth();
};

export const print = (state: State) => {
  const m = state.printMultiplier;
  // const pw = window.innerWidth / ratio;
  const pw = window.innerWidth;
  // const ph = window.innerHeight / ratio;
  const ph = window.innerHeight;
  state.printTarget.setSize(pw * m, ph * m);
  state.printTarget.setClearColor(state.backgroundColor, state.backgroundAlpha);
  state.printTarget.render(state.scene, state.camera);

  const c = document.createElement("canvas");
  c.width = state.view.diff.x * m;
  c.height = state.view.diff.y * m;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(
    state.printTarget.domElement,
    state.view.min.x * m,
    state.view.min.y * m,
    state.view.diff.x * m,
    state.view.diff.y * m,
    0,
    0,
    state.view.diff.x * m,
    state.view.diff.y * m
  );

  let link = document.createElement("a");
  c.toBlob(function (blob) {
    link.setAttribute(
      "download",
      "push-" + Math.round(new Date().getTime() / 1000) + ".png"
    );
    link.setAttribute("href", URL.createObjectURL(blob));
    link.dispatchEvent(
      new MouseEvent(`click`, {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );
  });
};

export function domLoadImage(callback: any) {
  let input = document.querySelector("#fileInput");
  async function handleChange(this: any) {
    for (let item of this.files) {
      if (item.type.indexOf("image") < 0) {
        continue;
      }
      let src = URL.createObjectURL(item);
      callback(src);
      this.removeEventListener("change", handleChange);
    }
  }
  input!.addEventListener("change", handleChange);

  input!.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window,
    })
  );
  return input;
}
