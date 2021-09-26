import { useEffect } from "react";
import {
  discretePanCamera,
  discreteZoom,
  interruptPointerKeyDown,
  interruptPointerKeyUp,
} from "./Actions";
import State from "./State";

type KeyboardProps = {
  state: State;
};

function Keyboard({ state }: KeyboardProps) {
  useEffect(() => {
    // const pressed = (key: string) => {};

    const downHandler = (e: KeyboardEvent) => {
      let press = e.key.toLowerCase();
      if (press === "-") {
        discreteZoom(state, 32);
      } else if (press === "+" || press === "=") {
        discreteZoom(state, -32);
      }
      if (!state.pressed.includes(press)) {
        state.pressed.push(press);
        interruptPointerKeyDown(state, press);
      }
      if (state.pressed.includes("arrowleft")) {
        discretePanCamera(state, [-1, 0]);
      }
      if (state.pressed.includes("arrowright")) {
        discretePanCamera(state, [1, 0]);
      }
      if (state.pressed.includes("arrowup")) {
        discretePanCamera(state, [0, -1]);
      }
      if (state.pressed.includes("arrowdown")) {
        discretePanCamera(state, [0, 1]);
      }
    };

    const upHandler = (e: KeyboardEvent) => {
      let press = e.key.toLowerCase();
      if (press === " ") {
        if (state.PointerHover.spacePointer) {
          state.PointerHover.spacePointer.remove();
          state.PointerHover.spacePointer = null;
        }
      }
      const index = state.pressed.indexOf(press);
      if (index !== -1) {
        state.pressed.splice(index, 1);
      }
      interruptPointerKeyUp(state, press);
    };

    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);
    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  }, [state]);

  return null;
}

export default Keyboard;
