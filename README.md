# Handwriting Recognition in VR
<img src="img/screenshot.gif" title="screen capture" alt="screen capture" width="250" style="text-align: center">

### **Description / Rationale**
This repository contains various implementations of handwritten text recognition for web virtual reality. The repository was created to demonstrate the possibility of doing handwritten text recognition in web virtual reality without any server or backend.

Handwritten text recognition in this repository combines machine learning, computer vision and NLP. Briefly how everything works: 
1. Segmentation is doen using OpenCV.js, i.e. bounding box of each element based on contour in an image is calculated, then segmented and placed based on distance between bounding box x position (top left) and left corner of image. It results in several segmentations based on the total number of characters.
2. Segmentation is then passed over to Tensorflow ML model (image segmentation task), imported and adapted from Keras model, which identifies to which class each segmented image corresponds.
3. The text string is generated and passed over to words base, which analyzes it for correspondence and divides into meaningful words.
4. At the end the text is displayed.

### **Instructions**
The repository contains the following: 
* A-Frame based implementation (see "a-frame-implementation" folder). It contains all steps as indicated above.
* Component for A-Frame (see: "a-frame-component" folder). It does not contain the last natural language processing (NLP) step.
* Simple html implementation (see "simple-implementation" folder). It contains all steps as indicated above.


### **UPDATES**
* Adding another language model.

### **Tech Stack**
Handwritten text recognition is powered by AFrame, Three.js and OpenCV.js and Tensorflow.js. To learn more about OpenCV.js and its various uses, please refer to another repository: https://github.com/akbartus/OpenCV-Examples-in-JavaScript.    

### **Demo**
The repository contains the following implementations/demos:
* <a href="https://handwriting-simple.glitch.me/">A-Frame implementation</a>.
* <a href="https://handwriting-component.glitch.me/">A-Frame component</a>.
