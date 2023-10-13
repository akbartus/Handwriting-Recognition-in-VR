// Updated version of texture painter
AFRAME.registerComponent("texture-painter", {
  schema: {
    color: {
      type: "color",
      default: "black",
    },
    size: {
      type: "int",
      default: 20,
    },
    background: {
      type: "color",
      default: "white",
    },
    clearAll: {
      type: "boolean",
      default: false,
    },
  },
  init: function () {
    this.color = this.data.color;
    this.size = this.data.size;
    this.background = this.data.background;

    this.el.sceneEl.addEventListener(
      "camera-set-active",
      this.cameraSetActive.bind(this)
    );
    this.el.sceneEl.addEventListener(
      "mousemove",
      this.onMouseMove.bind(this),
      false
    );
    this.el.sceneEl.addEventListener(
      "mouseup",
      this.onMouseUp.bind(this),
      false
    );
    this.el.sceneEl.addEventListener(
      "mousedown",
      this.onMouseDown.bind(this),
      false
    );
    this.el.sceneEl.addEventListener(
      "touchmove",
      this.onTouchMove.bind(this),
      false
    );
    this.el.sceneEl.addEventListener(
      "touchend",
      this.onTouchEnd.bind(this),
      false
    );
    this.el.sceneEl.addEventListener(
      "touchstart",
      this.onTouchStart.bind(this),
      false
    );

    this.el.sceneEl.addEventListener("loaded", () => {
      this.el.sceneEl.dispatchEvent(new CustomEvent("camera-set-active"));
    });

    this.el.addEventListener("raycaster-intersected", (evt) => {
      this.raycasterObj = evt.detail.el;
    });

    this.el.addEventListener("raycaster-intersected-cleared", (evt) => {
      this.lastX = null;
      this.lastY = null;
      this.raycasterObj = null;
    });

    var controllers = document.querySelectorAll(".controller");
    controllers.forEach((controller) => {
      controller.addEventListener("triggerdown", (evt) => {
        this.triggerdown = true;
      });
      controller.addEventListener("triggerup", (evt) => {
        this.triggerdown = false;
      });
    });

    var planeTexture = new THREE.Texture(
      undefined,
      THREE.UVMapping,
      THREE.MirroredRepeatWrapping,
      THREE.MirroredRepeatWrapping
    );
    var planeMaterial = new THREE.MeshPhongMaterial({
      map: planeTexture,
      shininess: 50,
    });
    this.mesh = this.el.getObject3D("mesh");
    this.mesh.material = planeMaterial;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.onClickPosition = new THREE.Vector2();
    this.renderer = this.el.sceneEl.renderer;
    this.parentTexture = planeTexture;
    this._parentTexture = [];
    this._canvas = document.createElement("canvas");
    this._canvas.width = 1500;
    this._canvas.height = 1000;
    this._context2D = this._canvas.getContext("2d");
    this.parentTexture.image = this._canvas;
    // draw background
    this._context2D.fillStyle = this.background;
    this._context2D.fillRect(0, 0, this._canvas.width, this._canvas.height);
    this.parentTexture.needsUpdate = true;
  },

  drawRemote: function (remoteDrawObject) {
    if (remoteDrawObject.lastX != null && remoteDrawObject.lastY != null) {
      this._context2D.beginPath();
      this._context2D.strokeStyle = remoteDrawObject.color;

      this._context2D.lineJoin = "round";
      this._context2D.lineWidth = remoteDrawObject.size;
      this._context2D.moveTo(remoteDrawObject.lastX, remoteDrawObject.lastY);
      this._context2D.lineTo(remoteDrawObject.x, remoteDrawObject.y);
      this._context2D.closePath();
      this._context2D.stroke();
      this.parentTexture.needsUpdate = true;
    }
  },
  eraseAllRemote: function () {
    this._context2D.fillStyle = this.background;
    this._context2D.fillRect(0, 0, this._canvas.width, this._canvas.height);
    this.parentTexture.needsUpdate = true;
  },
  update: function () {
    this.color = this.data.color;
    this.size = this.data.size;
    if (this.data.clearAll) {
      this.eraseAll();
    }
  },
  tick: function () {
    if (!this.raycasterObj) {
      return;
    } // Not intersecting.
    let intersection = this.raycasterObj.components.raycaster.getIntersection(
      this.el
    );
    if (!intersection) {
      return;
    }
    if (this.triggerdown) {
      var uv = intersection.uv;
      var x = uv.x;
      var y = 1 - uv.y;
      this._draw(x * this._canvas.width, y * this._canvas.height);
      this.lastX = x * this._canvas.width;
      this.lastY = y * this._canvas.height;
    } else {
      this.lastX = null;
      this.lastY = null;
    }
  },
  cameraSetActive: function () {
    this.camera = this.el.sceneEl.camera;
  },
  disableLookControls: function () {
    if (this.camera.el) {
      this.camera.el.setAttribute("look-controls", {
        enabled: false,
      });
    }
  },
  enableLookControls: function () {
    if (this.camera.el) {
      this.camera.el.setAttribute("look-controls", {
        enabled: true,
      });
    }
  },
  eraseAll: function () {
    this.eraseAllRemote();
  },
  _draw: function (x, y) {
    if (this.lastX != null && this.lastY != null) {
      var drawObject = {};
      drawObject.lastX = this.lastX;
      drawObject.lastY = this.lastY;
      drawObject.x = x;
      drawObject.y = y;
      drawObject.color = this.color;
      drawObject.size = this.size;
      this.drawRemote(drawObject);
      this.lastX = x;
      this.lastY = y;
    }
  },

  onMouseMove: function (evt) {
    evt.preventDefault();
    var array = this.getMousePosition(
      this.renderer.domElement,
      evt.clientX,
      evt.clientY
    );
    this.onClickPosition.fromArray(array);
    var intersects = this.getIntersects(this.onClickPosition, [
      this.el.getObject3D("mesh"),
    ]);
    if (intersects.length > 0 && intersects[0].uv) {
      var uv = intersects[0].uv;
      intersects[0].object.material.map.transformUv(uv);
      this._draw(uv.x * this._canvas.width, uv.y * this._canvas.height);
    }
  },
  onMouseDown: function (evt) {
    //evt.preventDefault();
    var array = this.getMousePosition(
      this.renderer.domElement,
      evt.clientX,
      evt.clientY
    );
    this.onClickPosition.fromArray(array);
    var intersects = this.getIntersects(this.onClickPosition, [
      this.el.getObject3D("mesh"),
    ]);
    if (intersects.length > 0 && intersects[0].uv) {
      this.disableLookControls();
      var uv = intersects[0].uv;
      intersects[0].object.material.map.transformUv(uv);
      this.lastX = uv.x * this._canvas.width;
      this.lastY = uv.y * this._canvas.height;
    }
  },
  onMouseUp: function (evt) {
    //evt.preventDefault();
    this.lastX = null;
    this.lastY = null;
    this.enableLookControls();
  },
  onTouchMove: function (evt) {
    evt.preventDefault();
    var touch = evt.touches[0];
    var array = this.getMousePosition(
      this.renderer.domElement,
      touch.clientX,
      touch.clientY
    );
    this.onClickPosition.fromArray(array);
    var intersects = this.getIntersects(this.onClickPosition, [
      this.el.getObject3D("mesh"),
    ]);
    if (intersects.length > 0 && intersects[0].uv) {
      var uv = intersects[0].uv;
      intersects[0].object.material.map.transformUv(uv);
      this._draw(uv.x * this._canvas.width, uv.y * this._canvas.height);
    }
  },

  onTouchStart: function (evt) {
    evt.preventDefault();
    var touch = evt.touches[0];
    var array = this.getMousePosition(
      this.renderer.domElement,
      touch.clientX,
      touch.clientY
    );
    this.onClickPosition.fromArray(array);
    var intersects = this.getIntersects(this.onClickPosition, [
      this.el.getObject3D("mesh"),
    ]);
    if (intersects.length > 0 && intersects[0].uv) {
      this.disableLookControls();
      var uv = intersects[0].uv;
      intersects[0].object.material.map.transformUv(uv);
      this.lastX = uv.x * this._canvas.width;
      this.lastY = uv.y * this._canvas.height;
    }
  },

  onTouchEnd: function (evt) {
    evt.preventDefault();
    this.lastX = null;
    this.lastY = null;
    this.enableLookControls();
  },

  getMousePosition: function (dom, x, y) {
    var rect = this.renderer.domElement.getBoundingClientRect();
    return [(x - rect.left) / rect.width, (y - rect.top) / rect.height];
  },
  getIntersects: function (point, objects) {
    if (!this.camera || !this.camera.isPerspectiveCamera) {
      return [];
    }
    this.mouse.set(point.x * 2 - 1, -(point.y * 2) + 1);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    return this.raycaster.intersectObjects(objects);
  },
});
