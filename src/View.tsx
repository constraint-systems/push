import State from "./State";
import * as THREE from "three";

class View {
  holder: HTMLElement;
  div: HTMLElement;
  mouse1: THREE.Vector2;
  mouse2: THREE.Vector2;
  min: THREE.Vector2;
  max: THREE.Vector2;
  topLeft: THREE.Vector2;
  botRight: THREE.Vector2;
  diff: THREE.Vector2;
  kind: "fullscreen" | "window";
  activeHandle: null | number;
  mouseOrigin: THREE.Vector2;
  mouseDiff: THREE.Vector2;
  minOrigin: THREE.Vector2;
  maxOrigin: THREE.Vector2;
  dragging: boolean;
  state: State;

  constructor(state: State, mouse1: THREE.Vector2, mouse2: THREE.Vector2) {
    this.div = document.createElement("div");
    this.mouse1 = new THREE.Vector2().copy(mouse1);
    this.mouse2 = new THREE.Vector2().copy(mouse2);
    this.min = new THREE.Vector2();
    this.max = new THREE.Vector2();
    this.topLeft = new THREE.Vector2(0, 0);
    this.botRight = new THREE.Vector2(window.innerWidth, window.innerHeight);
    this.diff = new THREE.Vector2();
    this.activeHandle = null;
    this.div.style.border = "solid 1px " + state.viewColor;
    this.div.style.position = "absolute";
    this.kind = "fullscreen";
    this.dragging = false;
    this.mouseOrigin = new THREE.Vector2();
    this.mouseDiff = new THREE.Vector2();
    this.minOrigin = new THREE.Vector2();
    this.maxOrigin = new THREE.Vector2();
    this.div.style.pointerEvents = "auto";
    this.state = state;

    this.div.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      this.dragging = true;
      this.mouseOrigin.set(e.clientX, e.clientY);
      this.minOrigin.copy(this.min);
      this.maxOrigin.copy(this.max);
      this.div.setPointerCapture(e.pointerId);
    });
    this.div.addEventListener("pointermove", (e) => {
      if (this.dragging) {
        this.mouseDiff.set(e.clientX, e.clientY).sub(this.mouseOrigin);
        this.mouse1.x = this.minOrigin.x + this.mouseDiff.x;
        this.mouse1.y = this.minOrigin.y + this.mouseDiff.y;
        this.mouse2.x = this.maxOrigin.x + this.mouseDiff.x;
        this.mouse2.y = this.maxOrigin.y + this.mouseDiff.y;
        this.update();
      }
    });
    this.div.addEventListener("pointerup", (e) => {
      this.dragging = false;
      this.div.releasePointerCapture(e.pointerId);
    });

    this.holder = document.createElement("div");
    this.holder.style.position = "fixed";
    this.holder.style.left = "0px";
    this.holder.style.top = "0px";
    this.holder.style.right = "0px";
    this.holder.style.bottom = "0px";
    this.holder.style.overflow = "hidden";
    this.holder.style.pointerEvents = "none";
    this.holder.appendChild(this.div);

    document.body.appendChild(this.holder);

    const positions = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ];
    const percents = {
      "-1": "0%",
      "0": "50%",
      "1": "100%",
    };
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      const div = document.createElement("div");
      div.style.width = 48 + "px";
      div.style.height = 48 + "px";
      div.style.position = "absolute";
      // @ts-ignore
      div.style.left = percents[position[0].toString()];
      // @ts-ignore
      div.style.top = percents[position[1].toString()];
      div.style.transform = "translate(-24px, -24px)";
      div.style.pointerEvents = "auto";
      div.style.display = "none";
      div.style.padding = "16px";
      const inner = document.createElement("div");
      inner.style.width = 16 + "px";
      inner.style.height = 16 + "px";
      inner.style.background = state.viewColor;
      div.appendChild(inner);
      div.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        this.activeHandle = i;
        if (position[0] === -1) {
          this.mouse1.x = this.max.x;
        } else if (position[0] === 1) {
          this.mouse1.x = this.min.x;
        }
        if (position[1] === -1) {
          this.mouse1.y = this.max.y;
        } else if (position[1] === 1) {
          this.mouse1.y = this.min.y;
        }
        div.setPointerCapture(e.pointerId);
      });
      div.addEventListener("pointermove", (e) => {
        if (this.activeHandle !== null) {
          if (position[0] !== 0) {
            this.mouse2.x = e.clientX;
          }
          if (position[1] !== 0) {
            this.mouse2.y = e.clientY;
          }
          this.update();
        }
      });
      div.addEventListener("pointerup", (e) => {
        this.activeHandle = null;
        div.releasePointerCapture(e.pointerId);
      });
      this.div.appendChild(div);
    }
    this.update();
  }

  showHandles() {
    this.div.style.pointerEvents = "auto";
    this.holder.style.zIndex = "40";
    for (const child of Array.from(this.div.childNodes)) {
      // @ts-ignore
      child.style.display = "block";
    }
  }

  hideHandles() {
    this.div.style.pointerEvents = "none";
    this.holder.style.zIndex = "1";
    for (const child of Array.from(this.div.childNodes)) {
      // @ts-ignore
      child.style.display = "none";
    }
  }

  updateColor() {
    for (const child of Array.from(this.div.childNodes)) {
      // @ts-ignore
      child.childNodes[0].style.background = this.state.viewColor;
    }
    this.div.style.borderColor = this.state.viewColor;
  }

  update() {
    if (this.kind === "window") {
      this.div.style.display = "block";
      this.showHandles();
      this.botRight.set(window.innerWidth, window.innerHeight);
      this.min.copy(this.mouse1).min(this.mouse2).max(this.topLeft);
      this.max.copy(this.mouse1).max(this.mouse2).min(this.botRight);
    } else if (this.kind === "fullscreen") {
      this.div.style.display = "none";
      this.hideHandles();
      // handle in action now
      // this.botRight.set(window.innerWidth, window.innerHeight);
      // this.min.copy(this.topLeft);
      // this.max.copy(this.botRight);
    }
    this.diff.copy(this.max).sub(this.min);
    this.div.style.left = this.min.x + "px";
    this.div.style.top = this.min.y + "px";
    this.div.style.width = this.diff.x + "px";
    this.div.style.height = this.diff.y + "px";
  }
}

export default View;
