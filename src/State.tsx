import * as Three from "three";
import { SubPointer } from "./PointerComponent";
import PointerOne from "./PointerOne";
import PointerThree from "./PointerThree";
import PointerTwo from "./PointerTwo";
import PointerMiddle from "./PointerMiddle";
import PointerHover from "./PointerHover";
import { Box } from "./Box";
import { MeshBasicMaterial } from "three";
import OutlineBox from "./OutlineBox";
import FullscreenQuad from "./FullscreenQuad";
import View from "./View";

class State {
  canvas: HTMLCanvasElement;
  camera: Three.PerspectiveCamera;
  initialCameraPosition: Three.Vector3;
  renderer: Three.WebGLRenderer;
  scene: Three.Scene;
  worldPixel: number;
  boxes: Array<Box>;
  group: Three.Object3D;
  // @ts-ignore
  outlineBoxes: Three.Object3D;
  heightGrid: Array<number>;
  selectedGrid: Array<number>;
  keyInterupts: Array<string>;
  hoverKeyInterrupts: Array<string>;
  cols: number;
  rows: number;
  depth: number;
  currentImageDims: [number, number];
  pressed: Array<string>;
  center: Three.Vector3;
  pressedOne: string;
  pointers: Array<SubPointer>;
  PointerOne: PointerOne;
  PointerTwo: PointerTwo;
  PointerThree: PointerThree;
  PointerMiddle: PointerMiddle;
  lastPointerButtonPressed: number;
  initialRotation: Three.Euler;
  gridCache: Array<number>;
  PointerHover: PointerHover;
  heightGridCache: Array<number>;
  viewScene: Three.Scene;
  highlightScene: Three.Scene;
  view: View;
  printCanvas: HTMLCanvasElement;
  printTarget: Three.WebGLRenderer;
  backgroundColor: number;
  viewColor: string;
  backgroundAlpha: number;
  highlightColor: number;
  highlightAlpha: number;
  fullscreenQuad: FullscreenQuad;
  mode: "normal" | "view";
  isTouch: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.camera = new Three.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.renderer = new Three.WebGLRenderer({
      canvas,
      logarithmicDepthBuffer: true,
      antialias: false,
    });
    this.renderer.autoClear = false;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.scene = new Three.Scene();
    this.pointers = [];
    this.boxes = [];
    this.cols = 8;
    this.rows = 8;
    this.depth = 48;
    this.selectedGrid = [];
    this.gridCache = [];
    this.heightGrid = [];
    this.heightGridCache = [];
    this.pressed = [];
    this.center = new Three.Vector3();
    this.initialCameraPosition = new Three.Vector3();
    this.pressedOne = "";
    this.PointerOne = new PointerOne(this);
    this.PointerTwo = new PointerTwo(this);
    this.PointerThree = new PointerThree(this);
    this.PointerMiddle = new PointerMiddle(this);
    this.PointerHover = new PointerHover(this);
    this.lastPointerButtonPressed = 0;
    this.keyInterupts = [" ", "d", "r", "control"];
    this.hoverKeyInterrupts = [" ", "d", "r"];
    this.initialRotation = new Three.Euler();
    this.mode = "normal";
    this.viewScene = new Three.Scene();
    this.highlightScene = new Three.Scene();
    this.printCanvas = document.createElement("canvas");
    this.printCanvas.width = window.innerWidth;
    this.printCanvas.height = window.innerHeight;
    this.printTarget = new Three.WebGLRenderer({
      canvas: this.printCanvas,
      alpha: true,
    });
    this.currentImageDims = [16, 16];
    this.viewColor = "#aaaaaa";
    this.view = new View(this, new Three.Vector2(), new Three.Vector2());
    this.backgroundColor = 0x000000;
    this.backgroundAlpha = 0;
    this.highlightColor = 0x00ffff;
    this.highlightAlpha = 0.3;
    this.fullscreenQuad = new FullscreenQuad();
    this.isTouch = window.matchMedia("(pointer: coarse)").matches;

    // set world pixel
    {
      const visibleHeight = 2 * Math.tan((this.camera.fov * Math.PI) / 360) * 5;
      this.worldPixel = visibleHeight / window.innerHeight;
    }

    this.group = new Three.Group();

    // this.lkadImage("ellott2.jpg");
    this.loadImage("bowiealt.jpg");

    // additional settings
    this.camera.position.z = 5;

    this.animate();
  }

  loadImage(src: string) {
    const loader = new Three.TextureLoader();
    loader.setCrossOrigin("");
    loader.load(
      src,
      (texture) => {
        this.scene.remove(this.group);
        this.group = new Three.Group();

        const limit = 1024;
        const img = texture.image;
        if (img.width > limit || img.height > limit) {
          const aspect = img.width / img.height;
          if (aspect > 1) {
            img.width = limit;
            img.height = img.width / aspect;
          } else {
            img.height = limit;
            img.width = img.height * aspect;
          }
        }
        const cellSize = this.worldPixel * 16;

        this.currentImageDims = [img.width, img.height];
        const cols = Math.round(img.width / 16);
        const rows = Math.round(img.height / 16);
        this.cols = cols;
        this.rows = rows;

        this.selectedGrid = Array(cols * rows).fill(0);
        this.heightGrid = Array(cols * rows).fill(1);

        const xPadded = (16 * cols) / 2 + 16 * 3;
        const yPadded = (16 * rows) / 2 + 16 * 3;
        const ray1 = new Three.Vector2(
          window.innerWidth / 2 - xPadded,
          window.innerHeight / 2 - yPadded
        );
        const ray2 = new Three.Vector2(
          window.innerWidth / 2 + xPadded,
          window.innerHeight / 2 + yPadded
        );
        this.view.mouse1.copy(ray1);
        this.view.mouse2.copy(ray2);
        this.view.update();
        this.changeMode("normal");

        const outlineBoxes = new OutlineBox(this, cellSize, cols, rows);
        const boxes = new Box(this, cellSize, cols, rows, this.depth, texture);
        (boxes.material as MeshBasicMaterial).map = texture;
        this.outlineBoxes = outlineBoxes;
        this.group = boxes;
      },
      () => {},
      (error) => {
        // @ts-ignore
        console.log(error.target);
      }
    );
  }

  animate() {
    this.renderer.setClearColor(this.backgroundColor, 1);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);

    this.renderer.setRenderTarget(this.fullscreenQuad.renderTarget);
    this.renderer.setClearColor(this.backgroundColor, 0);
    this.renderer.clear();
    this.renderer.render(this.highlightScene, this.camera);
    this.renderer.setRenderTarget(null);

    this.fullscreenQuad.material.opacity = this.highlightAlpha;
    this.renderer.render(this.fullscreenQuad.scene, this.fullscreenQuad.camera);

    requestAnimationFrame(this.animate.bind(this));
  }

  changeMode(newMode: "normal" | "view") {
    this.mode = newMode;
    if (this.mode === "view" && this.view.kind === "window") {
      this.view.showHandles();
    } else {
      this.view.hideHandles();
    }
  }
}

export default State;
