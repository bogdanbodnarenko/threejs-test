import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export class Renderer {
  scene = null;

  constructor(targetForCanvas) {
    this.targetForCanvas = targetForCanvas;
    this.init();
  }

  unmount(requestID) {
    window.removeEventListener("resize", this.handleWindowResize);
    window.cancelAnimationFrame(requestID);
    this.orbitControls.dispose();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.orbitControls.update();
  }

  get domElement() {
    return this.renderer.domElement;
  }

  init() {
    const width = this.targetForCanvas.clientWidth;
    const height = this.targetForCanvas.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x323232);
    this.scene.name = "Scene";

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    ambientLight.name = "AmbientLight";
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.name = "DirectionalLight";
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    directionalLight.shadow.camera.left = -60;
    directionalLight.shadow.camera.right = 60;
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.4);
    pointLight.name = "PointLight";
    pointLight.position.set(0, 200, 0);
    this.scene.add(pointLight);

    this.camera = new THREE.PerspectiveCamera(
      75, // fov = field of view
      width / height, // aspect ratio
      0.1, // near plane
      1000 // far plane
    );
    this.camera.position.z = 150;

    this.orbitControls = new OrbitControls(this.camera, this.targetForCanvas);
    this.orbitControls.zoomSpeed = 0.2;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;

    window.THREE = THREE;
    window.controls = this.orbitControls;
    window.scene = this.scene;
    window.renderer = this.renderer;
    window.customRenderer = this;

    const starMaterial = new THREE.PointsMaterial({
      color: "#bbd8ff",
      size: 0.5
    });

    const starGeometry = new THREE.Geometry();
    for (let i = 0; i < 6000; i++) {
      const star = new THREE.Vector3(
        Math.random() * 600 - 300,
        Math.random() * 600 - 300,
        Math.random() * 600 - 300
      );
      starGeometry.vertices.push(star);
    }

    const stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(stars);

    this.floor = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(1000, 1000),
      new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
    );
    this.floor.name = "Floor";
    this.floor.position.y = -50;
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);

    this.grid = new THREE.GridHelper(1000, 40, 0x000000, 0x000000);
    this.grid.name = "Grid";
    this.grid.position.y = -50;
    this.grid.material.transparent = true;
    this.grid.material.opacity = 0.25;
    this.scene.add(this.grid);

    this.raycaster = new THREE.Raycaster();

    this.renderer.domElement.addEventListener(
      "mousedown",
      event => this.emitMouseDown && this.emitMouseDown(event),
      false
    );
    this.renderer.domElement.addEventListener(
      "mousemove",
      event => this.emitMouseMove && this.emitMouseMove(event),
      false
    );
    this.renderer.domElement.addEventListener(
      "mouseup",
      event => this.emitMouseUp && this.emitMouseUp(event),
      false
    );
    this.renderer.domElement.addEventListener(
      "contextmenu",
      event => {
        event.preventDefault();

        if (this.emitContextMenu) {
          this.emitContextMenu(event);
        }
      },
      false
    );

    this.targetForCanvas.appendChild(this.renderer.domElement);
    window.addEventListener("resize", this.handleWindowResize);
  }

  handleWindowResize = () => {
    const width = this.targetForCanvas.clientWidth;
    const height = this.targetForCanvas.clientHeight;

    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;

    this.camera.updateProjectionMatrix();
  };

  checkMouseIntersection = (event, objects) => {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    this.raycaster.setFromCamera(mouse, this.camera);

    const intersects = objects
      ? this.raycaster.intersectObjects(objects)
      : this.raycaster.intersectObject(this.floor);

    if (!intersects.length) {
      return null;
    }

    return intersects[0];
  };

  fitCameraToObject = function(object, offset = 1.1) {
    const boundingBox = new THREE.Box3();

    boundingBox.setFromObject(object);

    const center = boundingBox.getCenter(new THREE.Vector3());

    const size = boundingBox.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);

    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= offset;

    this.camera.position.x = 0;
    this.camera.position.y = center.y + 2;
    this.camera.position.z = cameraZ;

    this.orbitControls.target = center;
  };

  onMouseDown(callback) {
    this.emitMouseDown = callback;
  }

  onMouseMove(callback) {
    this.emitMouseMove = callback;
  }

  onMouseUp(callback) {
    this.emitMouseUp = callback;
  }

  onContextMenu(callback) {
    this.emitContextMenu = callback;
  }

  enableOrbitControl() {
    this.orbitControls.enabled = true;
  }
  disableOrbitControl() {
    this.orbitControls.enabled = false;
  }
}
