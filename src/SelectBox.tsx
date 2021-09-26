import * as Three from "three";
import State from "./State";

export class SelectBox {
  mouse1: Three.Vector2;
  mouse2: Three.Vector2;
  min: Three.Vector2;
  max: Three.Vector2;
  diff: Three.Vector2;
  div: HTMLElement;

  constructor(state: State, initial: Three.Vector2, current: Three.Vector2) {
    this.mouse1 = new Three.Vector2();
    this.mouse2 = new Three.Vector2();
    this.min = new Three.Vector2();
    this.max = new Three.Vector2();
    this.diff = new Three.Vector2();
    this.mouse1.copy(initial);
    this.mouse2.copy(current);

    const color = new Three.Color(state.highlightColor);
    const div = document.createElement("div");
    this.div = div;
    const rgb = color.getStyle();
    const rgba =
      rgb.slice(0, rgb.length - 1) + "," + state.highlightAlpha + ")";
    div.style.background = rgba;
    div.style.border = "solid 1px " + rgb;
    div.style.position = "fixed";
    div.style.top = "0";
    div.style.left = "0";
    document.body.appendChild(div);
  }

  update(current: Three.Vector2) {
    this.mouse2.copy(current);
    this.min.copy(this.mouse2).min(this.mouse1);
    this.max.copy(this.mouse2).max(this.mouse1);
    this.diff.copy(this.max).sub(this.min);
    this.render();
  }

  render() {
    this.div.style.left = this.min.x + "px";
    this.div.style.top = this.min.y + "px";
    this.div.style.width = this.diff.x + "px";
    this.div.style.height = this.diff.y + "px";
  }

  destroy() {
    this.div.remove();
  }
}
