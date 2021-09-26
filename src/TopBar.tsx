import { useEffect, useRef, useState } from "react";
import { domLoadImage } from "./BareActions";
import State from "./State";
import * as THREE from "three";
import { print } from "./Actions";

interface ButtonProps {
  children: any;
  clickHandler?: any;
  active?: boolean;
  textColor: string;
}

function Button({
  children,
  clickHandler = null,
  active = false,
  textColor,
}: ButtonProps) {
  const shade = textColor === "black" ? "800" : "200";
  return (
    <div
      role="button"
      className={`h-16 flex items-center justify-center px-5 betterhover:hover:bg-gray-${shade} betterhover:hover:bg-opacity-10 ${
        active ? "bg-gray-" + shade : ""
      } bg-opacity-10 pointer-events-auto`}
      style={{ minWidth: "8ch" }}
      onClick={() => clickHandler && clickHandler()}
    >
      {children}
    </div>
  );
}

function HandleShortcut({ action, shortcut }) {
  useEffect(() => {
    const downHandler = (e: KeyboardEvent) => {
      let press = e.key.toLowerCase();
      if (press === shortcut) action();
    };

    window.addEventListener("keydown", downHandler);
    return () => {
      window.removeEventListener("keydown", downHandler);
    };
  }, [action, shortcut]);

  return null;
}

interface DialogProps {
  title: string;
  children: any;
  display: boolean;
  setDisplay: any;
  shortcut: string;
  clearModals: any;
}

function Dialog({
  title,
  children,
  display,
  setDisplay,
  shortcut,
  clearModals,
}: DialogProps) {
  const [offsetX, setOffSetX] = useState(0);
  const [offsetY, setOffSetY] = useState(0);
  const pointerDown = useRef(false);
  const pointerOrigin = useRef([0, 0]);
  const offsetOrigin = useRef([0, 0]);

  useEffect(() => {
    const downHandler = (e: KeyboardEvent) => {
      let press = e.key.toLowerCase();
      if (press === "escape") setDisplay(false);
      if (press === shortcut) {
        clearModals();
        setDisplay(!display);
      }
    };

    window.addEventListener("keydown", downHandler);
    return () => {
      window.removeEventListener("keydown", downHandler);
    };
  }, [display, shortcut, clearModals, setDisplay]);

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ display: display ? "block" : "none" }}
    >
      <div
        className="absolute left-1/2 bg-white text-black pointer-events-auto shadow-md"
        style={{
          top: 64,
          maxHeight: "calc(100% - 128px)",
          width: 440,
          maxWidth: "calc(100% - 32px)",
          transform: `translate(calc(${offsetX}px - 50%), ${offsetY}px)`,
          overflow: "auto",
        }}
      >
        <div className="flex border-b border-gray-200">
          <div
            className="px-4 py-3 select-none flex-grow"
            onPointerDown={(e) => {
              pointerDown.current = true;
              pointerOrigin.current = [e.clientX, e.clientY];
              offsetOrigin.current = [offsetX, offsetY];
            }}
            onPointerMove={(e) => {
              if (pointerDown.current) {
                setOffSetX(
                  offsetOrigin.current[0] + e.clientX - pointerOrigin.current[0]
                );
                setOffSetY(
                  offsetOrigin.current[1] + e.clientY - pointerOrigin.current[1]
                );
              }
            }}
            onPointerUp={() => {
              pointerDown.current = false;
            }}
          >
            {title}
          </div>
          <div
            role="button"
            className="px-5 py-3 hover:bg-gray-200 cursor-pointer select-none"
            onClick={() => setDisplay(false)}
          >
            X
          </div>
        </div>
        <div className="px-4 py-3">{children}</div>
      </div>
    </div>
  );
}

interface BarProps {
  state: State;
  setMode: any;
}

export function Bars({ state, setMode }: BarProps) {
  const [isFocus, setIsFocus] = useState(false);
  const [textColor, setTextColor] = useState("black");
  const [showAbout, setShowAbout] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [color, setColor] = useState("#000000");
  const [isTransparent, setIsTransparent] = useState(true);
  const [highlightColor, setHighlightColor] = useState("#00ffff");
  const [highlightAlpha, setHighlightAlpha] = useState(state.highlightAlpha);
  const [showView, setShowView] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [viewColor, setViewColor] = useState(state.viewColor);
  const colorRef = useRef(new THREE.Color());
  const [viewKind, setViewKind] = useState<"fullscreen" | "window">(
    state.view.kind
  );

  useEffect(() => {
    state.backgroundColor = parseInt(color.replace(/^#/, ""), 16);
    const threeColor = colorRef.current.set(color);
    if (
      threeColor.r * 255 * 0.299 +
        threeColor.g * 255 * 0.587 +
        threeColor.b * 255 * 0.114 >
      186
    ) {
      setTextColor("black");
    } else {
      setTextColor("white");
    }
  }, [color, state, setTextColor]);

  useEffect(() => {
    state.backgroundAlpha = isTransparent ? 0 : 1;
  }, [isTransparent, state]);

  useEffect(() => {
    state.viewColor = viewColor;
    state.view.updateColor();
  }, [viewColor, state]);

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

  useEffect(() => {
    setMode(showView ? "view" : "normal");
  }, [showView, state]);

  useEffect(() => {
    state.view.kind = viewKind;
    state.view.update();
  }, [viewKind, state]);

  const clearModals = () => {
    setShowAbout(false);
    setShowColors(false);
    setShowView(false);
    setShowControls(false);
  };

  return (
    <>
      <div
        className={`fixed left-0 top-0 right-0 h-16 text-${textColor} flex justify-center z-10 select-none pointer-events-none `}
      >
        <div className="flex">
          {isFocus ? null : (
            <>
              <Button
                textColor={textColor}
                clickHandler={() => domLoadImage(state.loadImage.bind(state))}
              >
                <u>o</u>pen
              </Button>
              <Button
                textColor={textColor}
                clickHandler={() => {
                  clearModals();
                  setShowAbout(!showAbout);
                }}
                active={showAbout}
              >
                <u>a</u>bout
              </Button>
              <Button
                textColor={textColor}
                clickHandler={() => {
                  clearModals();
                  setShowColors(!showColors);
                }}
                active={showColors}
              >
                <u>c</u>olors
              </Button>
            </>
          )}
          <Button
            textColor={textColor}
            clickHandler={() => {
              clearModals();
              setIsFocus(!isFocus);
            }}
            active={isFocus}
          >
            <u>f</u>ocus
          </Button>
          <HandleShortcut action={() => setIsFocus(!isFocus)} shortcut={"f"} />
          <HandleShortcut
            action={() => {
              clearModals();
              setIsFocus(false);
            }}
            shortcut={"escape"}
          />
        </div>
      </div>
      {/* bottom bar */}
      <div className="fixed left-0 bottom-0 right-0 h-16 text-${textColor flex justify-center z-10 select-none">
        <div className="flex">
          {isFocus ? null : (
            <>
              <Button
                textColor={textColor}
                clickHandler={() => {
                  clearModals();
                  setShowView(!showView);
                }}
                active={showView}
              >
                <u>v</u>iew
              </Button>
              <Button
                textColor={textColor}
                clickHandler={() => {
                  clearModals();
                  setShowControls(!showControls);
                }}
                active={showControls}
              >
                con<u>t</u>rols
              </Button>
            </>
          )}
          <Button textColor={textColor} clickHandler={() => print(state)}>
            <u>p</u>rint
          </Button>
        </div>
      </div>
      {/* Dialogs */}
      <Dialog
        title="About"
        display={showAbout}
        setDisplay={setShowAbout}
        shortcut="a"
        clearModals={clearModals}
      >
        <div className="mb-2">
          Push and pull blocks to distort an image. Select a section of the
          image then click and drag it to pull it towards you.
        </div>
        A{" "}
        <a href="https://constraint.systems" target="_blank">
          Constraint Systems
        </a>{" "}
        project
      </Dialog>
      <Dialog
        title="Colors"
        display={showColors}
        setDisplay={setShowColors}
        shortcut="c"
        clearModals={clearModals}
      >
        <div className="flex items-center justify-between mb-3 pb-3 border-b">
          <div>Transparent background on save</div>
          <input
            type="checkbox"
            checked={isTransparent}
            onChange={(e) => {
              setIsTransparent(e.target.checked);
            }}
          ></input>
        </div>
        <div className="flex items-center justify-between mb-3 pb-3 border-b">
          <div>Background color</div>
          <input
            style={{ display: "block" }}
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
            }}
          ></input>
        </div>
        <div className="flex items-center justify-between mb-3 pb-3 border-b">
          <div>Selection color</div>
          <input
            type="color"
            value={highlightColor}
            onChange={(e) => {
              setHighlightColor(e.target.value);
            }}
          ></input>
        </div>
        <div className="flex items-center justify-between mb-3 pb-3 border-b">
          <div>Selection color opacity</div>
          <div className="flex items-center">
            <input
              className="mr-2"
              type="range"
              value={highlightAlpha}
              min={0.1}
              step={0.1}
              max={1}
              onChange={(e) => {
                setHighlightAlpha(parseFloat(e.target.value));
              }}
            ></input>{" "}
            {highlightAlpha.toFixed(1)}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>View window color</div>
          <input
            style={{ display: "block" }}
            type="color"
            value={viewColor}
            onChange={(e) => {
              setViewColor(e.target.value);
            }}
          ></input>
        </div>
      </Dialog>
      <Dialog
        title="View"
        display={showView}
        setDisplay={setShowView}
        shortcut="v"
        clearModals={clearModals}
      >
        <div className="flex items-center justify-between mb-2 text-sm">
          View determines what part of the image is saved when you print. Use
          window mode to select only a section.
        </div>
        <div className="flex items-center justify-between">
          <div>Mode</div>
          <div className="flex items-center">
            <label
              className="mr-5"
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
                className="mr-2"
                checked={viewKind === "fullscreen"}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onChange={() => {
                  setViewKind("fullscreen");
                }}
              />
              fullscreen
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
                className="mr-2"
                value="Female"
                checked={viewKind === "window"}
              />
              window
            </label>
          </div>
        </div>
      </Dialog>
      <Dialog
        title="Controls"
        display={showControls}
        setDisplay={setShowControls}
        shortcut="t"
        clearModals={clearModals}
      >
        <div className="flex items-center justify-between mb-4">
          Click and drag to select an area. Click and drag a selected area to
          push and pull it.
        </div>
        <div className="flex items-center justify-between mb-2">
          <strong>Touch</strong>
        </div>
        <div className="flex items-center justify-between border-b pb-1 mb-1">
          <div>One-finger</div>
          <div>Select, push and pull</div>
        </div>
        <div className="flex items-center justify-between border-b pb-1 mb-1">
          <div>Two-finger</div>
          <div>Rotate, zoom</div>
        </div>
        <div className="flex items-center justify-between border-b pb-1 mb-5">
          <div>Three-finger</div>
          <div>Pan</div>
        </div>
        <div className="flex items-center justify-between mb-2">
          <strong>Keyboard and mouse</strong>
        </div>
        <div className="flex items-center justify-between border-b pb-1 mb-1">
          <div>Click and drag</div>
          <div>Select, push and pull</div>
        </div>
        <div className="flex items-center justify-between border-b pb-1 mb-1">
          <div>Scroll</div>
          <div>Zoom</div>
        </div>
        <div className="flex items-center justify-between border-b pb-1 mb-1">
          <div>Control + click and drag</div>
          <div>Paint select</div>
        </div>
        <div className="flex items-center justify-between border-b pb-1 mb-1">
          <div>Shift + click and drag</div>
          <div>Add to selection</div>
        </div>
        <div className="flex items-center justify-between border-b pb-1 mb-1">
          <div>r + move</div>
          <div>Rotate</div>
        </div>
        <div className="flex items-center justify-between border-b pb-1 mb-1">
          <div>d + move</div>
          <div>Pan</div>
        </div>
        <div className="flex items-center justify-between border-b pb-1 mb-1">
          <div>Arrows</div>
          <div>Pan</div>
        </div>
        <div className="flex items-center justify-between border-b pb-1 mb-1">
          <div>+ and -</div>
          <div>Zoom</div>
        </div>
        <div className="flex items-center justify-between border-b pb-1 mb-1">
          <div>Space</div>
          <div>Mouse click</div>
        </div>
      </Dialog>
    </>
  );
}
