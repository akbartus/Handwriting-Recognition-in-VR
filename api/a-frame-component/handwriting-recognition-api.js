if (AFRAME.utils.device.isMobile() === true || !AFRAME.utils.device.checkHeadsetConnected() === true) {
  document.querySelector("#drawingArea").setAttribute("class", "none");
} else {
  document.querySelector("#drawingArea").setAttribute("class", "clickable");
}
AFRAME.registerComponent("handwriting-recognition-api", {
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
    language: {
      type: "string",
      default: "en",
    },
  },
  init: function () {
    this.mouseDown = false;
    this.handwritingX = [];
    this.handwritingY = [];
    this.trace = [];
    

    this.color = this.data.color;
    this.size = this.data.size;
    this.background = this.data.background;
    this.language = this.data.language;
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

    let controllers = document.querySelectorAll(".controller");
    controllers.forEach((controller) => {
      controller.addEventListener("triggerdown", (evt) => {
        this.triggerdown = true;
      });
      controller.addEventListener("triggerup", (evt) => {
        this.triggerdown = false;
      });
      controller.addEventListener("xbuttondown", (evt) => {
        this.xbuttondown = true;
      });
      controller.addEventListener("ybuttondown", (evt) => {
        this.ybuttondown = true;
      });
    });

    let planeTexture = new THREE.Texture(
      undefined,
      THREE.UVMapping,
      THREE.MirroredRepeatWrapping,
      THREE.MirroredRepeatWrapping
    );
    let planeMaterial = new THREE.MeshPhongMaterial({
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
    if (this.xbuttondown) {
      let container = [];
      container.push(this.handwritingX);
      container.push(this.handwritingY);
      container.push([]);
      this.trace.push(container);
      this.lastX = null;
      this.lastY = null;
      recognize(this.trace, this.language);
      this.xbuttondown = false;
    }

    if (this.ybuttondown) {
      this.ybuttondown = false;
      this.eraseAll();
      this.trace = [];
      this.handwritingX = [];
      this.handwritingY = [];
    }
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
      let uv = intersection.uv;
      let x = uv.x;
      let y = 1 - uv.y;
      this._draw(x * this._canvas.width, y * this._canvas.height);
      this.lastX = x * this._canvas.width;
      this.lastY = y * this._canvas.height;
      this.handwritingX.push(x);
      this.handwritingY.push(y);
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
      let drawObject = {};
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
    if (this.mouseDown) {
      let array = this.getMousePosition(
        this.renderer.domElement,
        evt.clientX,
        evt.clientY
      );
      this.onClickPosition.fromArray(array);
      let intersects = this.getIntersects(this.onClickPosition, [
        this.el.getObject3D("mesh"),
      ]);
      if (intersects.length > 0 && intersects[0].uv) {
        let uv = intersects[0].uv;
        intersects[0].object.material.map.transformUv(uv);
        this._draw(uv.x * this._canvas.width, uv.y * this._canvas.height);
        let x = uv.x * this._canvas.width;
        let y = uv.y * this._canvas.height;
        this.handwritingX.push(x);
        this.handwritingY.push(y);
      }
    }
  },
  onMouseDown: function (evt) {
    //evt.preventDefault();
    let array = this.getMousePosition(
      this.renderer.domElement,
      evt.clientX,
      evt.clientY
    );
    this.onClickPosition.fromArray(array);
    let intersects = this.getIntersects(this.onClickPosition, [
      this.el.getObject3D("mesh"),
    ]);
    if (intersects.length > 0 && intersects[0].uv) {
      this.disableLookControls();
      let uv = intersects[0].uv;
      intersects[0].object.material.map.transformUv(uv);
      this.lastX = uv.x * this._canvas.width;
      this.lastY = uv.y * this._canvas.height;

      if (this.lastX != "" && this.lastY != "") {
        this.mouseDown = true;
        this.handwritingX = [];
        this.handwritingY = [];

        this.handwritingX.push(this.lastX);
        this.handwritingY.push(this.lastY);
      }
    }
  },
  onMouseUp: function (evt) {
    //evt.preventDefault();
    if (this.mouseDown == true) {
      let w = [];
      w.push(this.handwritingX);
      w.push(this.handwritingY);
      w.push([]);
      this.trace.push(w);
      this.lastX = null;
      this.lastY = null;
      this.enableLookControls();
      this.mouseDown = false;
      document.querySelector("#send").addEventListener("click", () => {
        recognize(this.trace, this.language);
      });
      document.querySelector("#clear").addEventListener("click", () => {
        this.eraseAll();
      });
    }
  },

  getMousePosition: function (dom, x, y) {
    let rect = this.renderer.domElement.getBoundingClientRect();
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

function recognize(trace, language) {
  var data = JSON.stringify({
    options: "enable_pre_space",
    requests: [
      {
        writing_guide: {
          writing_area_width: undefined,
          writing_area_height: undefined,
        },
        ink: trace,
        language: language,
      },
    ],
  });

  fetch(
    "https://www.google.com.tw/inputtools/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
    }
  )
    .then(function (response) {
      if (response.ok) {
        return response.json();
      } else if (response.status === 403) {
        throw new Error("access denied");
      } else if (response.status === 503) {
        throw new Error("can't connect to recognition server");
      }
    })
    .then(function (response) {
      var results;
      if (response.length === 1) {
        callback(undefined, new Error(response[0]));
      } else {
        results = response[1][0][1][0];

        document
          .querySelector("#outputText")
          .setAttribute("troika-text", `value: ${results}; align: center; width: 3`);
      }
    })
    .catch(function (error) {
      callback(undefined, error);
    });
}
