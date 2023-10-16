if (
  AFRAME.utils.device.isMobile() === true ||
  !AFRAME.utils.device.checkHeadsetConnected() === true
) {
  document.querySelector("#drawingArea").setAttribute("class", "none");
} else {
  document.querySelector("#drawingArea").setAttribute("class", "clickable");
}

// Create A-Frame element (console plane)
let outputText = document.createElement("a-entity");
outputText.setAttribute("id", "outputText");
outputText.setAttribute("position", "0 0.2 -3");
outputText.setAttribute(
  "geometry",
  "primitive: plane; width: 3.6; height: 0.3"
);
outputText.setAttribute("text", "value: Console; align: center; width: 3;");
outputText.setAttribute("material", "color: blue");

let scene = document.querySelector("a-scene");
scene.appendChild(outputText);


// Create DIVs
const wrapperDiv = document.createElement("div");
wrapperDiv.id = "wrapper";
wrapperDiv.style.display = "none";
wrapperDiv.style.position = "absolute";
wrapperDiv.style.top = "15%";
wrapperDiv.style.left = "50%";
wrapperDiv.style.transform = "translate(-50%, -50%)";
wrapperDiv.style.zIndex = "10";
const img1 = document.createElement("img");
img1.id = "image";
img1.style.display = "none";
const img2 = document.createElement("img");
img2.id = "displayedImage";
const resultDiv = document.createElement("div");
resultDiv.id = "result";
wrapperDiv.appendChild(img1);
wrapperDiv.appendChild(img2);
wrapperDiv.appendChild(resultDiv);
document.body.appendChild(wrapperDiv);

// Declare variables;
const imageElement = document.getElementById("image");
const result = document.getElementById("result");
let displayedImg = document.getElementById("displayedImage");

let plane = document.querySelector("#drawingArea");
let recognizeButton = document.querySelector("#recognize");
let eraseButton = document.querySelector("#erase");
let recognizedTxt = "";
let handwritingRecogntion;

////////////////////////////////
/// Handwriting Recognition  ///
////////////////////////////////
AFRAME.registerComponent("handwriting-recognition", {
  init: function () {
    //////////////////////////////////////////////////////////////////////
    /// OPENCV.JS FUNCTIONS. /// FIND CONTOURS AND BOUNDING RECTANGLES ///
    //////////////////////////////////////////////////////////////////////
    let opencvjs = document.createElement("script");
    opencvjs.setAttribute("src", "https://docs.opencv.org/4.3.0/opencv.js");
    document.body.appendChild(opencvjs);
    handwritingRecogntion = function findRect() {
      imageSegmentation();
      function imageSegmentation() {
        let src = cv.imread("image");

        let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
        cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
        cv.threshold(src, src, 177, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
        cv.GaussianBlur(
          src,
          src,
          { width: 5, height: 5 },
          0,
          0,
          cv.BORDER_DEFAULT
        );

        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();

        cv.findContours(
          src,
          contours,
          hierarchy,
          cv.RETR_LIST,
          cv.CHAIN_APPROX_NONE
        );

        // Convert color back
        cv.cvtColor(src, src, cv.COLOR_GRAY2BGR, 0);
        src.copyTo(dst);

        let cnt = contours.get(0);
        let rect = cv.boundingRect(cnt);
        let contoursColor = new cv.Scalar(255, 255, 255);
        let rectangleColor = new cv.Scalar(0, 255, 0);

        // Draw contours
        cv.drawContours(dst, contours, -1, contoursColor, 1);

        // Declare rect related arrays
        let rectanglesArrayAll = [];
        let rectanglesArrayPos = [];
        let rectanglesArrayToCut = [];

        // Loop through all the contours
        for (let i = 0; i < contours.size(); i++) {
          let cnt = contours.get(i);

          // Find the bounding rect for the contour
          let rect = cv.boundingRect(cnt);

          // Draw the bounding rect on the image
          let point1 = new cv.Point(rect.x, rect.y);
          let point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
          cv.rectangle(dst, point1, point2, rectangleColor, 2, cv.LINE_AA, 0);

          // Get all bounding rect values
          // Get X values of the rect, necessary to sort contours from left to right
          // Get rects to be cut
          if (rect.width < 400) {
            rectanglesArrayAll.push(rect);
            rectanglesArrayPos.push(rect.x);
            rectanglesArrayToCut.push(src.roi(rect));
          }
        }

        let removeIndexes = getInnerRectIndexes(rectanglesArrayAll);
        rectanglesArrayToCut = removeInner(rectanglesArrayToCut, removeIndexes);
        rectanglesArrayPos = removeInner(rectanglesArrayPos, removeIndexes);

        // Sort rect based on x position and get indexes of the sorted from small x to the big x value
        let sortedRectanglesArray = Array.from(
          Array(rectanglesArrayPos.length).keys()
        ).sort((a, b) =>
          rectanglesArrayPos[a] < rectanglesArrayPos[b]
            ? -1
            : (rectanglesArrayPos[b] < rectanglesArrayPos[a]) | 0
        );

        // Create canvases, assignt images and respective ids
        for (let k of sortedRectanglesArray) {
          // Compare the length of sortedRectanglesArray
          for (let i = 0; i <= 20; i++) {
            // If index matches
            if (k === i) {
              // Create separate canvas for each rect
              createCanvas(dst, rectanglesArrayToCut, k);
            }
          }
        }
        // Clean OpenCV
        src.delete();
        dst.delete();
        contours.delete();
        hierarchy.delete();
        cnt.delete();
      }

      // Create canvases for each identified bounding rect
      function createCanvas(source, rectanglesArrayToCut, increment) {
        source = rectanglesArrayToCut[increment];
        let outputCanvas = document.createElement("canvas");
        outputCanvas.id = `output${increment}`;
        outputCanvas.style.border = "2px solid rgb(0, 175, 0)";
        outputCanvas.style.padding = "3px";
        outputCanvas.style.margin = "5px";
        outputCanvas.style.height = "20px";
        result.appendChild(outputCanvas);
        cv.imshow(`output${increment}`, source);
      }

      // get inner rect indexes (for example for letters O, A, etc.)
      function getInnerRectIndexes(rects) {
        let innerContoursIndexes = [];
        for (let index = 0; index < rects.length; index++) {
          for (let index2 = 0; index2 < rects.length; index2++) {
            let rectMain = rects[index];
            let rectInner = rects[index2];

            if (isInnerRect(rectMain, rectInner)) {
              innerContoursIndexes.push(index2);
            }
          }
        }
        loadModel();
        return innerContoursIndexes;
      }

      // Check if it is inner rect
      function isInnerRect(rectMain, rectInner) {
        let rectMainCoordinateX = rectMain.x + rectMain.width;
        let rectMainCoordinateY = rectMain.y + rectMain.height;
        let rectInnerCoordinateX = rectInner.x + rectInner.width;
        let rectInnerCoordinateY = rectInner.y + rectInner.height;

        let isInsideX =
          rectInner.x > rectMain.x &&
          rectInnerCoordinateX < rectMainCoordinateX;
        let isInsideY =
          rectInner.y > rectMain.y &&
          rectInnerCoordinateY < rectMainCoordinateY;
        return isInsideX && isInsideY;
      }

      // Remove inner rects
      function removeInner(rects, removeIndexes) {
        let rectInnerCoordinate = [];
        for (let index = 0; index < rects.length; index++) {
          if (removeIndexes.find((element) => element == index) != undefined) {
            continue;
          }
          rectInnerCoordinate.push(rects[index]);
        }
        return rectInnerCoordinate;
      }
    };

    ///////////////////////////////////////////////////////
    ///// TF.js Handwritten Text Recognition         //////
    ///////////////////////////////////////////////////////
    class Model {
      // Initializee the Model class and load
      constructor() {
        this.alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        this.characters =
          "0123456789" + this.alphabet.toUpperCase() + this.alphabet;

        this.isWarmedUp = this.loadModel().then(() => {
          tf.setBackend("cpu"); // remove this line to work on GPU
          console.info("Backend running on:", tf.getBackend());
        });
      }

      // Load the model
      loadModel() {
        console.time("Load model");
        return tf.loadLayersModel("model/model.json").then((model) => {
          this._model = model;
          console.timeEnd("Load model");
          //console.log(model.input.shape);   // uncomment this to see the shape
          //console.log(model.summary)        // uncomment this to see model summary
        });
      }

      // Take an ImageData object and reshape it to fit the model
      preprocessImage(pixelData) {
        const targetDim = 28,
          edgeSize = 2,
          resizeDim = targetDim - edgeSize * 2,
          padVertically = pixelData.width > pixelData.height,
          padSize = Math.round(
            (Math.max(pixelData.width, pixelData.height) -
              Math.min(pixelData.width, pixelData.height)) /
              2
          ),
          padSquare = padVertically
            ? [
                [padSize, padSize],
                [0, 0],
                [0, 0],
              ]
            : [
                [0, 0],
                [padSize, padSize],
                [0, 0],
              ];

        return tf.tidy(() => {
          // convert the pixel data into a tensor with 1 data channel per pixel
          // i.e. from [h, w, 4] to [h, w, 1]
          let tensor = tf.browser
            .fromPixels(pixelData, 1)
            // pad it such that w = h = max(w, h)
            .pad(padSquare, 255.0);

          // scale it down
          tensor = tf.image
            .resizeBilinear(tensor, [resizeDim, resizeDim])
            // pad it with blank pixels along the edges (to better match the training data)
            .pad(
              [
                [edgeSize, edgeSize],
                [edgeSize, edgeSize],
                [0, 0],
              ],
              255.0
            );

          // invert and normalize to match training data
          tensor = tf.scalar(1.0).sub(tensor.toFloat().div(tf.scalar(255.0)));
          // Reshape again to fit training model [N, 28, 28, 1]
          // where N = 1 in this case
          return tensor.expandDims(0);
        });
      }

      // Take an ImageData objects and predict a character
      predict(pixelData) {
        if (!this._model) return console.warn("Model not loaded yet!");
        console.time("Prediction");
        let tensor = this.preprocessImage(pixelData),
          prediction = this._model.predict(tensor).as1D(),
          // get the index of the most probable character
          argMax = prediction.argMax().dataSync()[0],
          probability = prediction.max().dataSync()[0],
          // get the character at that index
          character = this.characters[argMax];
        //console.log("Predicted", character, "Probability", probability);
        console.timeEnd("Prediction");
        return [character, probability];
      }
    }

    // Recognize
    function recognize(loadedModel) {
      // Set counter for repeating prediction and declare img variable
      let counter = 0;
      let img;
      // Do Batch recognition
      // clean output
      recognizedTxt = "";
      function doBatchRecognition() {
        //Set time out
        setTimeout(function () {
          let recognized = [];
          // Set selector every time differently, i.e. take based on canvas id
          // Canvas id is generated based on the number of bounding rects detected
          img = document.querySelector(`#${result.children[counter].id}`);
          console.log(img);
          let [character, probability] = loadedModel.predict(img);
          // Add Letter recognized to the array
          recognized.push(character);
          // Add Letter consequently on each loop
          recognizedTxt += character;

          // Remove this if using word creator
          outputText.setAttribute(
            "text",
            `value: ${recognizedTxt.replace(
              /0/g,
              "O"
            )}; align: center; width: 3`
          );
          counter++;
          // Check the number of canvases (created based on bounding rects detected)
          // And their match with counter
          if (counter < result.children.length) {
            // Now, change the src of the canvas to new one
            img.src = result.children[counter].toDataURL();
            // Call function again, recursively
            doBatchRecognition();
          }
        }, 100);
      }
      doBatchRecognition();
    }

    ////////////////////////////
    /// Preload TF.js Model  ///
    ////////////////////////////
    let loadedModel = new Model();
    loadedModel.isWarmedUp;
    // Check that model is loaded and then activate recognition function
    function loadModel() {
      recognize(loadedModel);
    }
  },
});

////////////////////////////////
/// Texture Painter Component///
////////////////////////////////
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

     this.el.sceneEl.addEventListener('camera-set-active', this.cameraSetActive.bind(this));
           this.el.sceneEl.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        this.el.sceneEl.addEventListener('touchmove', this.onMouseMove.bind(this), false);
        this.el.sceneEl.addEventListener('mouseup', this.onMouseUp.bind(this), false);
        this.el.sceneEl.addEventListener('touchend', this.onMouseUp.bind(this), false);
        this.el.sceneEl.addEventListener('mousedown', this.onMouseDown.bind(this), false);
        this.el.sceneEl.addEventListener('touchstart', this.onMouseDown.bind(this), false);

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
     let array = this.getMousePosition(this.renderer.domElement, evt.clientX, evt.clientY);
    this.onClickPosition.fromArray(array);
    let intersects = this.getIntersects(this.onClickPosition, [
      this.el.getObject3D("mesh"),
    ]);
    if (intersects.length > 0 && intersects[0].uv) {
      let uv = intersects[0].uv;
      intersects[0].object.material.map.transformUv(uv);
      this._draw(uv.x * this._canvas.width, uv.y * this._canvas.height);
    }
  },
  onMouseDown: function (evt) {
    //evt.preventDefault();
let array = this.getMousePosition(this.renderer.domElement, evt.clientX , evt.clientY);
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
    }
  },
  onMouseUp: function (evt) {
    //evt.preventDefault();
    this.lastX = null;
    this.lastY = null;
    this.enableLookControls();
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

////////////////////////////
/// Begin                ///
////////////////////////////
AFRAME.registerComponent("button-listener", {
  init: function () {
    let el = this.el;
    el.addEventListener("xbuttondown", function (evt) {
      const parentElement = document.getElementById("result");
      while (parentElement.firstChild) {
        parentElement.removeChild(parentElement.firstChild);
      }
      let mesh3D = plane.getObject3D("mesh");
      let texture = mesh3D.material.map.image.toDataURL();
      imageElement.src = texture;
      displayedImg.src = imageElement.src;
      document
        .getElementById("displayedImage")
        .setAttribute(
          "style",
          "width: 100px; border: 2px solid #000000; margin-top: 10%;"
        );
      new Promise((resolve) => {
        resolve();
      }).then(() => {
        handwritingRecogntion();
      });
    });

    el.addEventListener("ybuttondown", function (evt) {
      plane.setAttribute("texture-painter", "clearAll: true");
      plane.setAttribute("texture-painter", "clearAll: false");
    });
  },
});
