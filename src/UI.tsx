import { useEffect, useRef, useState } from "react";
import State from "./State";
import { domLoadImage } from "./BareActions";
import { print } from "./Actions";
import * as THREE from "three";
import { Mode } from "./App";
import MovableBox from "./MovableBox";

type Props = {
  state: State;
  settingsAreOpen: boolean;
  setSettingsAreOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
};

function UI({
  state,
  settingsAreOpen,
  setSettingsAreOpen,
  mode,
  setMode,
}: Props) {
  const [color, setColor] = useState("#000000");
  const [isTransparent, setIsTransparent] = useState(true);
  const [highlightColor, setHighlightColor] = useState("#00ffff");
  const [highlightAlpha, setHighlightAlpha] = useState(state.highlightAlpha);
  const pointerDown = useRef([0, 0]);
  const initialView = useRef([0, 0]);
  const draggingView = useRef(false);
  const viewEl = useRef<HTMLElement | null>(null);
  const [viewLeft, setViewLeft] = useState(window.innerWidth / 2);
  const [viewTop, setViewTop] = useState(window.innerHeight / 2);
  const colorRef = useRef(new THREE.Color());
  const [viewKind, setViewKind] = useState<"fullscreen" | "window">(
    state.view.kind
  );

  useEffect(() => {
    state.backgroundColor = parseInt(color.replace(/^#/, ""), 16);
  }, [color, state]);

  useEffect(() => {
    state.backgroundAlpha = isTransparent ? 0 : 1;
  }, [isTransparent, state]);

  useEffect(() => {
    state.view.kind = viewKind;
    state.view.update();
  }, [viewKind, state]);

  useEffect(() => {
    const threeColor = colorRef.current.set(highlightColor);
    if (state.outlineBoxes) {
      // @ts-ignore
      state.outlineBoxes.material.uniforms.color.value.set(
        threeColor.r,
        threeColor.g,
        threeColor.b
      );
      state.highlightColor = threeColor.getHex();
    }
  }, [highlightColor, state]);

  useEffect(() => {
    state.highlightAlpha = highlightAlpha;
  }, [highlightAlpha, state]);

  return (
    <>
      <MovableBox title="About" />
      <div
        ref={viewEl}
        style={{
          display: mode === "view" ? "block" : "none",
          position: "fixed",
          left: viewLeft,
          top: viewTop,
          transform: "translate(-50%, -50%)",
          background: "#fff",
          color: "#222",
          width: 560,
          maxWidth: "100%",
          maxHeight: "100%",
          overflow: "auto",
          padding: "16px 16px",
          zIndex: 99,
          userSelect: "none",
        }}
        onPointerDown={(e) => {
          pointerDown.current = [e.clientX, e.clientY];
          initialView.current = [viewLeft, viewTop];
          draggingView.current = true;
          viewEl.current!.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (draggingView.current) {
            const dx = e.clientX - pointerDown.current[0];
            const dy = e.clientY - pointerDown.current[1];
            setViewLeft(initialView.current[0] + dx);
            setViewTop(initialView.current[1] + dy);
          }
        }}
        onPointerUp={(e) => {
          draggingView.current = false;
          viewEl.current!.releasePointerCapture(e.pointerId);
        }}
      >
        <div>Change view</div>
        <div>View size determines the size of the image when you print</div>
        <div
          style={{
            position: "absolute",
            right: 16,
            top: 16,
            width: 16,
            height: 16,
            textAlign: "center",
            lineHeight: "16px",
            cursor: "pointer",
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onClick={() => {
            setMode("normal");
          }}
        >
          X
        </div>
        <div>
          <div>
            <label
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onClick={() => {
                setViewKind("fullscreen");
              }}
            >
              <input
                type="radio"
                value="Male"
                checked={viewKind === "fullscreen"}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onChange={() => {
                  setViewKind("fullscreen");
                }}
              />
              Fullscreen
            </label>
            <label
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onClick={() => {
                setViewKind("window");
              }}
            >
              <input
                type="radio"
                value="Female"
                checked={viewKind === "window"}
              />
              Window
            </label>
          </div>
        </div>
      </div>
      <div
        style={{
          position: "fixed",
          left: 0,
          bottom: 0,
          right: 0,
          height: 88,
          paddingTop: 16,
          paddingBottom: 16,
          paddingLeft: 24,
          paddingRight: 24,
          display: "flex",
          columnGap: 16,
          justifyContent: "space-between",
        }}
      >
        <div
          role="button"
          onClick={() => {
            domLoadImage(state.loadImage.bind(state));
          }}
        >
          O
        </div>
        <div
          role="button"
          onClick={() => {
            setSettingsAreOpen(!settingsAreOpen);
          }}
        >
          S
        </div>
        <div
          role="button"
          onClick={() => {
            setMode("view");
          }}
        >
          A
        </div>
        <div
          role="button"
          onClick={() => {
            setMode("view");
          }}
        >
          V
        </div>
        <div
          role="button"
          onClick={() => {
            print(state);
          }}
        >
          P
        </div>
      </div>
      <div
        style={{
          display: settingsAreOpen ? "block" : "none",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99,
        }}
        onClick={() => {
          setSettingsAreOpen(false);
        }}
      >
        <div
          style={{
            display: settingsAreOpen ? "block" : "none",
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "#eee",
            color: "#222",
            width: 560,
            maxWidth: "100%",
            maxHeight: "100%",
            overflow: "auto",
            padding: "16px 16px",
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div style={{ paddingBottom: 8, fontWeight: "bold" }}>Settings</div>
          <div
            style={{
              position: "absolute",
              right: 16,
              top: 16,
              width: 16,
              height: 16,
              textAlign: "center",
              lineHeight: "16px",
              cursor: "pointer",
            }}
            onClick={() => {
              setSettingsAreOpen(false);
            }}
          >
            X
          </div>
          <div>
            <div style={{ paddingTop: 8, paddingBottom: 8 }}>
              <div style={{ paddingBottom: 8 }}>Background</div>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={isTransparent}
                    onChange={(e) => {
                      setIsTransparent(e.target.checked);
                    }}
                  ></input>{" "}
                  transparent on save
                </label>
              </div>
            </div>
            <div style={{ paddingBottom: 8 }}>Color</div>
            <div>
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                }}
              ></input>{" "}
            </div>
          </div>
          <div>
            <div style={{ paddingTop: 8, paddingBottom: 8 }}>
              <div>Selection color</div>
            </div>
            <div>
              <input
                type="color"
                value={highlightColor}
                onChange={(e) => {
                  setHighlightColor(e.target.value);
                }}
              ></input>
            </div>
            <div>Selection color opacity</div>
            <div>
              <input
                type="range"
                value={highlightAlpha}
                min={0.1}
                step={0.1}
                max={1}
                onChange={(e) => {
                  setHighlightAlpha(parseFloat(e.target.value));
                }}
              ></input>{" "}
              {highlightAlpha}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default UI;
