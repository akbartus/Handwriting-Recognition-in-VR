# Handwriting Recognition in VR
<img src="img/screenshot.gif" title="screen capture" alt="screen capture" width="250" style="text-align: center">

### **Description / Rationale**
This repository contains various implementations of handwritten text recognition for web virtual reality. The repository was created to demonstrate the possibility of doing handwritten text recognition in web virtual reality based on API and without APU and any server or backend. 

Handwritten text recognition in this repository combines machine learning, computer vision and NLP. Briefly how everything works: 
1. Segmentation is doen using OpenCV.js, i.e. bounding box of each element based on contour in an image is calculated, then segmented and placed based on distance between bounding box x position (top left) and left corner of image. It results in several segmentations based on the total number of characters.
2. Segmentation is then passed over to Tensorflow ML model (image segmentation task), imported and adapted from Keras model, which identifies to which class each segmented image corresponds.
3. The text string is generated and passed over to words base, which analyzes it for correspondence and divides into meaningful words.
4. At the end the text is displayed.

### **Uses**
It should be noted that this handwriting recognition can be used to create new game mechanics. For example: 
* In-game or in-application handwriting based challenge or level.
* Language learning experiences.
* Quizzes.
* Others?

### **Instructions**
The repository contains the following: 
* A-Frame based implementation (see "a-frame-implementation" folder). It contains all steps as indicated above.
* Component for A-Frame (see: "a-frame-component" folder). It does not contain the last natural language processing (NLP) step.
* Simple html implementation (see "simple-implementation" folder). It contains all steps as indicated above.

To use A-Frame component, please make sure to attach the following to <a-plane> element: <b>handwriting-recognition texture-painter id="drawingArea" class="clickable"</b>. Below sample code is provided:
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
<b>Please note:</b> This A-Frame component is attached after a-scene element. It does not have recognize and clear buttons for mouse clicks. It only supports VR mode with controllers.

<b>Please note:</b> A-Frame implementation and component also support Quest 2 buttons: <b>button X - recognize, button Y - clear.</b>


### **TFJS models**
The repo has the following Tensorflow.js models, which are tiny and robust enough to be run on mobile devices (and therefore very suitable for web experiences):
* Alphanumeric model (used in all examples).
* Only letters models (16-bit and 32-bit floating-point types; see: "misc" folder).

### **Updates**
It is definitely possible to add other language models and therefore do handwriting recognition in that language. Soon will add new language model. In addition, will be providing small tutorial on how to train own model.

### **Tech Stack**
Handwritten text recognition is powered by AFrame, Three.js and OpenCV.js and Tensorflow.js. It also uses updated/modified <a href="https://github.com/marlon360/whiteboard-vr">texture painter component</a>, which is part of Whiteboard VR by Marlon Lückert.  

To learn more about OpenCV.js and its various uses, please refer to another repository: https://github.com/akbartus/OpenCV-Examples-in-JavaScript.    

### **Demo**
The repository contains the following implementations/demos:
* <a href="https://handwriting-vr.glitch.me/">A-Frame implementation</a>.
* <a href="https://handwriting-component.glitch.me/">A-Frame component</a>.
* <a href="https://handwriting-simple.glitch.me/">Simple html demo</a>.
