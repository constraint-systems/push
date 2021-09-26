import { useEffect, useRef, useState } from "react";
import State from "./State";
import PointerComponent from "./PointerComponent";
import KeyboardComponent from "./Keyboard";
import { Bars } from "./TopBar";

export type Mode = "normal" | "view";

function App() {
  const canvasRef = useRef(null!);
  const [state, setState] = useState<null | State>(null);
  const [mode, setMode] = useState<Mode>("normal");

  useEffect(() => {
    if (state !== null) {
      state.changeMode(mode);
    }
  }, [mode, state]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const newState = new State(canvas);
    setState(newState);

    const handleResize = () => {
      const xChange = window.innerWidth - newState.renderer.domElement.width;
      const yChange = window.innerHeight - newState.renderer.domElement.height;

      newState.view.mouse1.copy(newState.view.min);
      newState.view.mouse2.copy(newState.view.max);

      newState.view.mouse1.x += xChange / 2;
      newState.view.mouse1.y += yChange / 2;
      newState.view.mouse2.x += xChange / 2;
      newState.view.mouse2.y += yChange / 2;

      const percent =
        window.innerHeight / 2 / (newState.renderer.domElement.height / 2);

      const minToCenterX = newState.view.mouse1.x - window.innerWidth / 2;
      newState.view.mouse1.x = minToCenterX * percent + window.innerWidth / 2;
      const maxToCenterX = newState.view.mouse2.x - window.innerWidth / 2;
      newState.view.mouse2.x = maxToCenterX * percent + window.innerWidth / 2;

      const minToCenterY = newState.view.mouse1.y - window.innerHeight / 2;
      newState.view.mouse1.y = minToCenterY * percent + window.innerHeight / 2;
      const maxToCenterY = newState.view.mouse2.y - window.innerHeight / 2;
      newState.view.mouse2.y = maxToCenterY * percent + window.innerHeight / 2;

      newState.view.update();

      newState.renderer.setSize(window.innerWidth, window.innerHeight);
      newState.camera.aspect = window.innerWidth / window.innerHeight;
      newState.camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (state) {
      const onPaste = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        for (const item of e.clipboardData.items) {
          if (item.type.indexOf("image") < 0) {
            continue;
          }
          let file = item.getAsFile();
          let src = URL.createObjectURL(file);
          state.loadImage(src);
        }
      };

      const onDrop = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        let file = e.dataTransfer.files[0];
        let src = URL.createObjectURL(file);
        state.loadImage(src);
      };

      const onDrag = (e: any) => {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      };

      window.addEventListener("paste", onPaste);
      window.addEventListener("dragover", onDrag);
      window.addEventListener("drop", onDrop);
      return () => {
        window.removeEventListener("paste", onPaste);
        window.removeEventListener("dragover", onDrag);
        window.removeEventListener("drop", onDrop);
      };
    }
  }, [state]);

  return (
    <>
      <input id="fileInput" type="file" style={{ display: "none" }}></input>
      <canvas ref={canvasRef}></canvas>
      {state ? (
        <>
          <PointerComponent state={state} />
          <KeyboardComponent state={state} />
          <Bars state={state} setMode={setMode} />
        </>
      ) : null}
    </>
  );
}

export default App;
