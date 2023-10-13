const wrapperDiv = document.createElement('div');
wrapperDiv.id = 'wrapper';
wrapperDiv.style.display = 'none';
wrapperDiv.style.position = 'absolute';

wrapperDiv.style.top = '15%';
wrapperDiv.style.left = '50%';
wrapperDiv.style.transform = 'translate(-50%, -50%)';
wrapperDiv.style.zIndex = '10';


const img1 = document.createElement('img');
img1.id = 'image';
img1.style.display = 'none';

const img2 = document.createElement('img');
img2.id = 'displayedImage';

// Create result div
const resultDiv = document.createElement('div');
resultDiv.id = 'result';

// Append elements to the wrapper div
wrapperDiv.appendChild(img1);
wrapperDiv.appendChild(img2);
wrapperDiv.appendChild(resultDiv);
// Append the wrapper div to the document body
document.body.appendChild(wrapperDiv);






const imageElement = document.getElementById("image");
const result = document.getElementById("result");
let displayedImg = document.getElementById("displayedImage");
let outputText = document.querySelector("#outputText");
let plane = document.querySelector("#drawingArea");
let recognizeButton = document.querySelector("#recognize");
let eraseButton = document.querySelector("#erase");
let recognizedTxt = '';


/////////////////////////////////////
/// WORD CREATOR                  ///
/////////////////////////////////////
async function getSampleText() {
  await fetch("words-list.txt")
    .then((response) => response.text())
    .then((text) => {
      const wordList = text;
      // Create a regular expression for splitting the input string.
      const splitRegex = new RegExp("[^a-zA-Z0-9']+", "g");

      // Initialize the variables for storing the maximum word length and the word costs.
      let maxWordLen = 0;
      let wordCost = {};

      // Split the word list into an array of words.
      const words = wordList.split("\n");

      // Calculate the word costs based on the word list.
      words.forEach((word, index) => {
        wordCost[word] = Math.log((index + 1) * Math.log(words.length));
      });

      // Find the maximum word length.
      words.forEach((word) => {
        if (word.length > maxWordLen) {
          maxWordLen = word.length;
        }
      });

      console.log(maxWordLen);
      //console.log(split(process.argv[2]));

      /**
       * Split the input string into an array of words.
       * @param {string} s The input string.
       * @return {Array} The array of words.
       */
      function split(s) {
        const list = [];
        s.split(splitRegex).forEach((sub) => {
          _split(sub).forEach((word) => {
            list.push(word);
          });
        });
        return list;
      }

      /**
       * Split the input string into an array of words.
       * @private
       * @param {string} s The input string.
       * @return {Array} The array of words.
       */
      function _split(s) {
        const cost = [0];

        /**
         * Find the best match for the i first characters, assuming cost has been built for the i-1 first characters.
         * @param {number} i The index of the character to find the best match for.
         * @return {Array} A pair containing the match cost and match length.
         */
        function best_match(i) {
          const candidates = cost
            .slice(Math.max(0, i - maxWordLen), i)
            .reverse();
          let minPair = [Number.MAX_SAFE_INTEGER, 0];
          candidates.forEach((c, k) => {
            let ccost;
            if (wordCost[s.substring(i - k - 1, i).toLowerCase()]) {
              ccost = c + wordCost[s.substring(i - k - 1, i).toLowerCase()];
            } else {
              ccost = Number.MAX_SAFE_INTEGER;
            }
            if (ccost < minPair[0]) {
              minPair = [ccost, k + 1];
            }
          });
          return minPair;
        }

        // Build the cost array.
        for (let i = 1; i < s.length + 1; i++) {
          cost.push(best_match(i)[0]);
        }

        // Backtrack to recover the minimal-cost string.
        const out = [];
        let i = s.length;
        while (i > 0) {
          const c = best_match(i)[0];
          const k = best_match(i)[1];
          if (c === cost[i]) {
            console.log("Done: " + c);
          }

          let newToken = true;
          if (s.slice(i - k, i) !== "'") {
            if (out.length > 0) {
              if (
                out[-1] === "'s" ||
                (Number.isInteger(s[i - 1]) && Number.isInteger(out[-1][0]))
              ) {
                out[-1] = s.slice(i - k, i) + out[-1];
                newToken = false;
              }
            }
          }

          if (newToken) {
            out.push(s.slice(i - k, i));
          }

          i -= k;
        }
        return out.reverse();
      }
     
      let editedText = recognizedTxt;
       
      // Generate the result
      resultingTxt = split(editedText);
      // Edit resulting text to remove outliers
      // If 0 is found inside of a string word, replace it with O
      // Please note that words base has words for each case, "0" and "O" to prevent errors
      for (let i = 0; i < resultingTxt.length; i++) {
          let pattern = /^[0-9]+$/;
        // Rule 1. Replace "0" with "O" if it is not numeric only 
        if (!pattern.test(resultingTxt[i])) {
            resultingTxt[i] = resultingTxt[i].replace(/0/g, "O");
          }
      }
      outputText.setAttribute("text", `value: ${resultingTxt.toString().replace(/,/g, ' ')}; align: center; width: 3`);
    });
}

//////////////////////////////////////////////////////////////////////
/// OPENCV.JS FUNCTIONS. /// FIND CONTOURS AND BOUNDING RECTANGLES ///
//////////////////////////////////////////////////////////////////////
let opencvjs = document.createElement("script");
opencvjs.setAttribute("src", "https://docs.opencv.org/4.3.0/opencv.js");
document.body.appendChild(opencvjs);

function findRect() {
  imageSegmentation();
  function imageSegmentation() {
    let src = cv.imread("image");

    let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(src, src, 177, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
    cv.GaussianBlur(src, src, { width: 5, height: 5 }, 0, 0, cv.BORDER_DEFAULT);
    //cv.adaptiveThreshold(src, src, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2)

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
    outputCanvas.style.border = '2px solid rgb(0, 175, 0)';
    outputCanvas.style.padding = '3px';
    outputCanvas.style.margin = '5px';
    outputCanvas.style.height = '20px';
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
      rectInner.x > rectMain.x && rectInnerCoordinateX < rectMainCoordinateX;
    let isInsideY =
      rectInner.y > rectMain.y && rectInnerCoordinateY < rectMainCoordinateY;
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
}

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
  recognizedTxt = '';
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
      outputText.setAttribute("text", `value: ${recognizedTxt.replace(/0/g, "O")}; align: center; width: 3`);
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
  // // Add additional step to divide result into words based on word creator
  // setTimeout(() => {
  //   getSampleText();
  // }, 4000);
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

////////////////////////////
/// Begin                ///
////////////////////////////
recognizeButton.addEventListener("click", () => {
  const parentElement = document.getElementById("result");
  while (parentElement.firstChild) {
    parentElement.removeChild(parentElement.firstChild);
  }
  let mesh3D = plane.getObject3D("mesh");
  let texture = mesh3D.material.map.image.toDataURL();
  imageElement.src = texture;
  displayedImg.src = imageElement.src;
  document.getElementById("displayedImage").setAttribute("style", "width: 100px; border: 2px solid #000000; margin-top: 10%;");
  new Promise((resolve) => {
    resolve();
  }).then(() => {
    findRect();
  });
}) 

eraseButton.addEventListener("click", function () {
  plane.setAttribute("texture-painter", "clearAll: true");
  plane.setAttribute("texture-painter", "clearAll: false");
})