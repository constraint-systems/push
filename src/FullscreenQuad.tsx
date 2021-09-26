import * as THREE from "three";

class FullscreenQuad {
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderTarget: THREE.RenderTarget;
  material: THREE.MeshBasicMaterial;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    const visibleHeight = 2 * Math.tan((this.camera.fov * Math.PI) / 360) * 5;
    const worldPixel = visibleHeight / window.innerHeight;

    this.renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight
    );
    const geometry = new THREE.PlaneBufferGeometry(
      window.innerWidth * worldPixel,
      window.innerHeight * worldPixel
    );
    this.material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.3,
    });
    const cube = new THREE.Mesh(geometry, this.material);
    this.scene = new THREE.Scene();
    this.scene.add(cube);
    this.camera.position.z = 5;

    this.material.map = this.renderTarget.texture;
  }
}

export default FullscreenQuad;
