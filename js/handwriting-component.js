AFRAME.registerComponent("handwriting", {
  schema: {
    color: {
      type: "color",
      default: "black",
    },
    backgroundColor: {
      type: "color",
      default: "white",
    },
    clearAll: {
      type: "boolean",
      default: false,
    },
    size: {
      type: "int",
      default: 20,
    },
    language: {
      type: "string",
      default: "en",
    },
  },
  init: function () {
    this.id = Math.floor(Math.random() * 100000000);
    this.color = this.data.color;
    this.size = this.data.size;
    this.background = this.data.backgroundColor;
    this.drawing = false;
    this.language = this.data.language;
    let cam = document.createElement("a-camera");
    let scene = document.querySelector("a-scene");
    cam.setAttribute("cursor", "rayOrigin: mouse");
    cam.setAttribute("raycaster", "objects: .clickable");
    scene.appendChild(cam);
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
      "touchmove",
      this.onMouseMove.bind(this),
      false
    );
    this.el.sceneEl.addEventListener(
      "mouseup",
      this.onMouseUp.bind(this),
      false
    );
    this.el.sceneEl.addEventListener(
      "touchend",
      this.onMouseUp.bind(this),
      false
    );
    this.el.sceneEl.addEventListener(
      "mousedown",
      this.onMouseDown.bind(this),
      false
    );
    this.el.sceneEl.addEventListener(
      "touchstart",
      this.onMouseDown.bind(this),
      false
    );
    this.handwritingX = [];
    this.handwritingY = [];

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
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1,
    });
    this.mesh = this.el.getObject3D("mesh");
    this.mesh.material = planeMaterial;
    //this.mesh.rotation.x = THREE.MathUtils.degToRad(-45);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.onClickPosition = new THREE.Vector2();

    this.renderer = this.el.sceneEl.renderer;

    this.parentTexture = planeTexture;
    this._parentTexture = [];

    this._canvas = document.createElement("canvas");
    this._canvas.width = 1000;
    this._canvas.height = 1000;
    this._context2D = this._canvas.getContext("2d");

    this.parentTexture.image = this._canvas;

    // draw background
    this._context2D.fillStyle = this.background;
    this._context2D.fillRect(0, 0, this._canvas.width, this._canvas.height);

    this.parentTexture.needsUpdate = true;
    this.trace = [];
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
  eraseAllRemote: function (remoteEraseAllObject) {
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
    var eraseAllObject = {};

    eraseAllObject.id = this.id;
    this.eraseAllRemote(eraseAllObject);
  },
  _draw: function (x, y) {
    if (this.lastX != null && this.lastY != null) {
      var drawObject = {};
      drawObject.id = this.id;
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
    // evt.preventDefault();
    if (this.drawing) {
      var array = this.getMousePosition(
        this.renderer.domElement,
        evt.clientX || evt.touches[0].clientX,
        evt.clientY || evt.touches[0].clientY
      );

      this.onClickPosition.fromArray(array);

      this.handwritingX.push(array[0]);
      this.handwritingY.push(array[1]);

      var intersects = this.getIntersects(this.onClickPosition, [
        this.el.getObject3D("mesh"),
      ]);

      if (intersects.length > 0 && intersects[0].uv) {
        var uv = intersects[0].uv;
        intersects[0].object.material.map.transformUv(uv);
        this._draw(uv.x * this._canvas.width, uv.y * this._canvas.height);
      }
    }
  },
  onMouseDown: function (evt) {
    //evt.preventDefault();

    if (evt.clientX || evt.clientY) {
      var array = this.getMousePosition(
        this.renderer.domElement,
        evt.clientX,
        evt.clientY
      );
      this.onClickPosition.fromArray(array);
   
    }
    else if (evt.touches && (evt.touches[0].clientX || evt.touches[0].clientY)) {
      var array = this.getMousePosition(
        this.renderer.domElement,
        evt.touches[0].clientX,
        evt.touches[0].clientY
      );
      this.onClickPosition.fromArray(array);

    }

    var intersects = this.getIntersects(this.onClickPosition, [
      this.el.getObject3D("mesh"),
    ]);

    if (intersects.length > 0 && intersects[0].uv) {
      this.disableLookControls();

      var uv = intersects[0].uv;
      intersects[0].object.material.map.transformUv(uv);

      this.lastX = uv.x * this._canvas.width;
      this.lastY = uv.y * this._canvas.height;
      this.drawing = true;
      this.handwritingX.push(array[0]);
      this.handwritingY.push(array[1]);
      
    }
  },
  onMouseUp: function (evt) {
    //evt.preventDefault();

    var w = [];
    w.push(this.handwritingX);
    w.push(this.handwritingY);
    w.push([]);
    this.trace.push(w);

    this.drawing = false;
    this.lastX = null;
    this.lastY = null;

    this.enableLookControls();
  },

  getMousePosition: function (dom, x, y) {
    var rect = this.renderer.domElement.getBoundingClientRect();
    return [(x - rect.left) / rect.width, (y - rect.top) / rect.height];
  },

  getIntersects: function (point, objects) {
    this.mouse.set(point.x * 2 - 1, -(point.y * 2) + 1);

    this.raycaster.setFromCamera(this.mouse, this.camera);

    return this.raycaster.intersectObjects(objects);
  },

  recognize: function () {
    var data = JSON.stringify({
      options: "enable_pre_space",
      requests: [
        {
          writing_guide: {
            writing_area_width: undefined,
            writing_area_height: undefined,
          },
          ink: [this.trace[0]],
          language: this.language,
        },
      ],
    });

    fetch(
      "https://www.google.com.tw/inputtools/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data,
      }
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.length === 1) {
          console.log("Please Write Something!");
        } else {
          let results = data[1][0][1][0];
          console.log(results);
          // Comment out if there is no need to use troika text
          if (document.querySelector("#resultingText")) {
            document.querySelector("#resultingText").setAttribute("troika-text", `value: ${results}`);
          }
          // clear
          this.trace = [];
          this.handwritingX = [];
          this.handwritingY = [];
        }
      });
  },
});
