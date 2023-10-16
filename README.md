# Handwriting Recognition in VR
<img src="img/screenshot.gif" title="screen capture" alt="screen capture" width="250" style="text-align: center">

### **Description / Rationale**
This repository contains various implementations of handwritten text recognition for web virtual reality. The repository was created to show the possibility of doing handwritten text recognition in web virtual reality based on API and without API or any server (only front end). 

There are two types of handwritten text recognition:
* <b>Handwritten text recognition based on stroke related data</b>, which uses simple API access to the incredible handwriting recognition of Google IME and generates the results (i.e. API based).
* <b>Handwritten text recognition based on image analysis</b>, which uses ML image classification model powered by Tensorflow.js (i.e. serverless and without any API).

The first type of handwritten text recognition allows to do the recognition of text, using Google IME API, of the majority of languages of the world. Notably, this API is used for doing handwritten text conversion on <a href="https://support.google.com/gboard/answer/9108773?hl=en&co=GENIE.Platform%3DAndroid">Android Devices</a>.  
 
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
* A-Frame component with Google IME API (see "API" > "a-frame-component" folder). 

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

<b>Sample usage of A-Frame component (with API)</b> is provided below:
```
<!DOCTYPE html>
<html>
<head>
    <title>Handwriting Recognition in VR: A-Frame Component with API</title>
    <script src='https://aframe.io/releases/1.4.2/aframe.min.js'></script>
    <script src="https://unpkg.com/aframe-troika-text/dist/aframe-troika-text.min.js"></script>
</head>
<body>
    <a-scene>
        <a-plane id="drawingArea" class="clickable" handwriting-recognition-api position="0 1.5 -5" rotation="0 0 0" width="5" height="4"></a-plane>
        
        <a-entity id="outputText" position="0 0.2 -4" geometry="primitive: plane; width: 3.6; height: 0.3"
        troika-text="value: Console" material="color: blue"></a-entity>
        <a-entity id="send" troika-text="value: Send" position="-2.5 0.2 -4" class="clickable" geometry="primitive: plane; height: 0.3" material="color: black">
        </a-entity>
        <a-entity id="clear" troika-text="value: Clear" position="2.5 0.2 -4" class="clickable" geometry="primitive: plane; height: 0.3" material="color: black">
        </a-entity>
       
        <a-entity cursor="rayOrigin: mouse" raycaster="objects: .clickable;"></a-entity>
        <a-entity  class="controller" laser-controls="hand: left" raycaster="objects: .clickable;" line="color: #000000"></a-entity> 
        <a-sky color="#ECECEC" rotation="0 -90 0"></a-sky>
    </a-scene>
    <script src='handwriting-recognition-api.js'></script>

</body>
</html>
```
<b>Please note:</b> In this example we are using troika text component, which allows to show text in other languages.

### **Language Codes**
The following is a list of language codes, which can be used with A-Frame component using Google IME API:
| Language              | code  |
|-----------------------|-------|
| Afrikaans             | af    |
| Albanian              | sq    |
| Basque                | eu    |
| Belarusian            | be    |
| Bulgarian             | bg    |
| Catalan               | ca    |
| Chinese (Simplified)  | zh_CN |
| Chinese (Traditional) | zh_TW |
| Croatian              | hr    |
| Czech                 | cs    |
| Danish                | da    |
| Dutch                 | nl    |
| English               | en    |
| Estonian              | et    |
| Filipino              | fil   |
| Finnish               | fi    |
| French                | fr    |
| Galician              | gl    |
| German                | de    |
| Greek                 | el    |
| Haitian               | ht    |
| Hindi                 | hi    |
| Hungarian             | hu    |
| Icelandic             | is    |
| Indonesian            | id    |
| Irish                 | ga    |
| Italian               | it    |
| Japanese              | ja    |
| Korean                | ko    |
| Latin                 | la    |
| Latvian               | lv    |
| Lithuanian            | lt    |
| Macedonian            | mk    |
| Malay                 | ms    |
| Norwegian             | no    |
| Polish                | pl    |
| Portuguese (Brazil)   | pt_BR |
| Portuguese (Portugal) | pt_PT |
| Romanian              | ro    |
| Russian               | ru    |
| Serbian               | sr    |
| Slovak                | sk    |
| Slovenian             | sl    |
| Spanish               | es    |
| Swahili               | sw    |
| Swedish               | sv    |
| Thai                  | th    |
| Turkish               | tr    |
| Ukranian              | yk    |
| Vietnamese            | vi    |
| Welsh                 | cy    |

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
  - <a href="https://handwriting-component.glitch.me/">A-Frame component, serveless</a>.
  - <a href="https://handwriting-simple.glitch.me/">Simple html demo</a>.
* API based:
  - <a href="https://handwriting-api.glitch.me/">A-Frame Component, API</a>.

