# Handwriting Recognition in VR
<img src="img/screenshot.gif" title="screen capture" alt="screen capture" width="250" style="text-align: center">

### **Description / Rationale**
This repository contains various implementations of handwritten text recognition for web virtual reality. The repository was created to show the possibility of doing handwritten text recognition in web virtual reality based on API and without API or any server (only front end). 

There are two types of handwritten text recognition:
* <b>Handwritten text recognition based on stroke related data</b>, which uses simple API access to the incredible handwriting recognition of Google IME and generates the results (i.e. API based).
* <b>Handwritten text recognition based on image analysis</b>, which uses ML image classification model powered by Tensorflow.js (i.e. serverless and without any API).

The first type of handwritten text recognition allows to do the recognition of text in the majority of languages of the world (see: https://www.google.com/inputtools/help/languages.html). 
 
The second type of handwritten text recognition combines machine learning, computer vision and NLP and only recognizes English letters (A-z) and digits (0-9). Here is briefly how everything works in it: 
1. Segmentation is doen using OpenCV.js, i.e. bounding box of each element based on contour in an image is calculated, then segmented and placed based on distance between bounding box x position (top left) and left corner of image. It results in several segmentations based on the total number of characters.
2. Segmentation is then passed over to Tensorflow ML model (image segmentation task), imported and adapted from Keras model, which identifies to which class each segmented image corresponds.
3. The text string is generated and passed over to words base, which analyzes it for correspondence and divides into meaningful words.
4. At the end the text is displayed.

The second type of handwritten text recognition also has the following Tensorflow.js models, which are tiny and robust enough to be run on mobile devices (and therefore very suitable for web experiences):
* Alphanumeric model (used in all examples).
* Only letters models (16-bit and 32-bit floating-point types; see: "serverless" > "misc").

### **Uses**
It should be noted that this handwriting recognition repository and examples it contains can be used to create new game mechanics. For example: 
* In-game or in-application handwriting based challenge or level.
* Language learning experiences.
* Quizzes.
* Others?

### **Instructions**
The repository contains the following: 
* A-Frame based implementation (see: "serverless" > "a-frame-implementation" folder). It contains the last natural language processing (NLP) step (dividing into meaningful words).
* Component for A-Frame (see: "serverless" > "a-frame-component" folder). It does not contain the last natural language processing (NLP) step (dividing into meaningful words).
* Simple html implementation (see "serverless" > "simple-implementation" folder). It contains the last natural language processing (NLP) step (dividing into meaningful words).

<b>To use A-Frame component (serveless one)</b>, please make sure to attach the following to <a-plane> element: <b>handwriting-recognition texture-painter id="drawingArea" class="clickable"</b>. Below sample code is provided:
```
<html>
    <head>
    <title>Handwriting Recognition in VR: A-Frame Demo</title>
    <script src='https://aframe.io/releases/1.4.2/aframe.min.js'></script>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js"></script>
</head>
    <body>
        <a-scene>
           <a-plane handwriting-recognition texture-painter id="drawingArea" class="clickable" position="0 1.5 -4" rotation="0 0 0" width="5" height="4"></a-plane>
           <a-entity cursor="rayOrigin: mouse" raycaster="objects: .clickable;"></a-entity>
           <a-entity  button-listener class="controller" laser-controls="hand: left" raycaster="objects: .clickable;" line="color: #000000"> 
           <a-sky color='#ECECEC'></a-sky>
        </a-scene>
        <script src="handwriting-recognition.js"></script>
    </body>
</html>
```
<b>Please note:</b> This A-Frame component is attached after a-scene element. It does not have recognize and clear buttons for mouse clicks. It only supports VR mode with controllers. A-Frame implementation and component also support Quest 2 buttons: <b>button X - recognize, button Y - clear.</b>



### **Updates**
It is definitely possible to add other ML language models and therefore do handwriting recognition in that language. Soon will add new language model. In addition, will be providing small tutorial on how to train own model.

### **Tech Stack**
Handwritten text recognition is powered by AFrame, Three.js and OpenCV.js and Tensorflow.js. It uses updated/modified <a href="https://github.com/marlon360/whiteboard-vr">texture painter component</a>, which is part of Whiteboard VR by Marlon Lückert. The code related to API was developed based on the example provided in Chen Yu Ho's <a href="https://github.com/ChenYuHo/handwriting.js">Handwriting.js repository</a>, and Amit Agarwal's blog post <a href="https://www.labnol.org/code/19205-google-handwriting-api">"Google Handwriting IME API Request"</a>.  

To learn more about OpenCV.js and its various uses, please refer to: https://github.com/akbartus/OpenCV-Examples-in-JavaScript.
To see another creative use of drawing in web VR, please refer to: https://github.com/akbartus/VR-Doodle-Painter.  

### **Demo**
The repository contains the following implementations/demos:
* Serverless:
  - <a href="https://handwriting-vr.glitch.me/">A-Frame implementation</a>.
  - <a href="https://handwriting-component.glitch.me/">A-Frame component</a>.
  - <a href="https://handwriting-simple.glitch.me/">Simple html demo</a>.
* API based:

