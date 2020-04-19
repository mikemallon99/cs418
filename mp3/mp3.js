
/**
 * @file A simple WebGL example for viewing meshes read from OBJ files
 * @author Eric Shaffer <shaffer1@illinois.edu>
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;
var shaderProgramSkybox;
var curShaderProgram;

/** @global The Modelview matrix */
var mvMatrix = mat4.create();

/** @global The View matrix */
var vMatrix = mat4.create();

var mMatrix = mat4.create();

/** @global The Projection matrix */
var pMatrix = mat4.create();

/** @global The Normal matrix */
var nMatrix = mat3.create();

/** @global The matrix stack for hierarchical modeling */
var mvMatrixStack = [];

/** @global An object holding the geometry for a 3D mesh */
var myMesh;

/** @global the 3d mesh for our skybox */
var mySkybox;


// View parameters
/** @global Location of the camera in world coordinates */
var eyePt = vec3.fromValues(0.0,0.0,2.0);
/** @global Direction of the view in world coordinates */
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
/** @global Up vector for view matrix creation, in world coordinates */
var up = vec3.fromValues(0.0,1.0,0.0);
/** @global Location of a point along viewDir in world coordinates */
var viewPt = vec3.fromValues(0.0,0.0,0.0);

//Light parameters
/** @global Light position in VIEW coordinates */
var lightPosition = [1,1,1];
/** @global Ambient light color/intensity for Phong reflection */
var lAmbient = [205.0/255.0,163.0/255.0,63.0/255.0];
/** @global Diffuse light color/intensity for Phong reflection */
var lDiffuse = [1,1,1];
/** @global Specular light color/intensity for Phong reflection */
var lSpecular =[1,1,1];

//Material parameters
/** @global Ambient material color/intensity for Phong reflection */
var kAmbient = [.5,.5,.5];
/** @global Diffuse material color/intensity for Phong reflection */
var kTerrainDiffuse = [205.0/255.0,163.0/255.0,63.0/255.0];
/** @global Specular material color/intensity for Phong reflection */
var kSpecular = [1.0,1.0,1.0];
/** @global Shininess exponent for Phong reflection */
var shininess = 100;
/** @global Edge color fpr wireframeish rendering */
var kEdgeBlack = [0.0,0.0,0.0];
/** @global Edge color for wireframe rendering */
var kEdgeWhite = [1.0,1.0,1.0];

var loadTexture = false;


//Model parameters
var eulerY=0;
var potRotation=0;
// Specifies between different types of shading
var renderType = 0;
//-------------------------------------------------------------------------
/**
 * Load the cube texture map and upload it
 */
function createTexture(gl) {
  // Create a texture.
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
  // Specify the paths to the photos
  const faceInfos = [
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      url: 'London/pos-x.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      url: 'London/neg-x.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      url: 'London/pos-y.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      url: 'London/neg-y.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      url: 'London/pos-z.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      url: 'London/neg-z.png',
    },
  ];
  faceInfos.forEach((faceInfo) => {
    const {target, url} = faceInfo;

    // Upload the canvas to the cubemap face.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 512;
    const height = 512;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;

    // setup each face so it's immediately renderable
    gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

    // Asynchronously load an image
    const image = new Image();
    image.src = url;
    image.addEventListener('load', function() {
      // Now that the image has loaded upload it to the texture.
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texImage2D(target, level, internalFormat, format, type, image);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      console.log("loaded image: ", url);
    });
  });
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  // Mark textures as loaded
  loadTexture = true;
}

//-------------------------------------------------------------------------
/**
 * Asynchronously read a server-side text file
 */
function asyncGetFile(url) {
  //Your code here
  console.log("Getting text file");
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = () => resolve(xhr.responseText);
    xhr.onerror = () => reject(xhr.statusText);
    xhr.send();
    console.log("Made promise");
  });
}

//-------------------------------------------------------------------------
/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(curShaderProgram.mvMatrixUniform, false, mvMatrix);
  // Export the camera position to the shader
  gl.uniform3fv(shaderProgram.uniformCameraLoc, eyePt);
}

//-------------------------------------------------------------------------
/**
 * Upload the model and view matrices separately to the shaders
 */
function uploadMatrices(mvMatrix, vMatrix) {
  gl.uniformMatrix4fv(curShaderProgram.mMatrixUniform, false, mvMatrix);
  gl.uniformMatrix4fv(curShaderProgram.vMatrixUniform, false, vMatrix);
}

//-------------------------------------------------------------------------
/**
 * Upload the render type to the shader
 */
function setRenderType() {
  gl.uniform1i(shaderProgram.uniformRenderType, renderType);
}

/**
  * Tell shader to use our texture
  */
function uploadTexture() {
  gl.uniform1i(shaderProgram.uniformTextureLoc, 0);
  gl.uniform1i(shaderProgramSkybox.uniformTextureLoc, 0);
}

//-------------------------------------------------------------------------
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(curShaderProgram.pMatrixUniform,
                      false, pMatrix);
}

//-------------------------------------------------------------------------
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
  mat3.fromMat4(nMatrix,mMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(curShaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
/**
 * Pushes matrix onto modelview matrix stack
 */
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


//----------------------------------------------------------------------------------
/**
 * Pops matrix off of modelview matrix stack
 */
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

//----------------------------------------------------------------------------------
/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);

  // If we don't find an element with the specified id
  // we do an early exit
  if (!shaderScript) {
    return null;
  }

  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }

  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }

  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

//----------------------------------------------------------------------------------
/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  vertexShaderSkybox = loadShaderFromDOM("shader-vs-skybox");
  fragmentShaderSkybox = loadShaderFromDOM("shader-fs-skybox");

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  shaderProgramSkybox = gl.createProgram();
  gl.attachShader(shaderProgramSkybox, vertexShaderSkybox);
  gl.attachShader(shaderProgramSkybox, fragmentShaderSkybox);
  gl.linkProgram(shaderProgramSkybox);

  if (!gl.getProgramParameter(shaderProgramSkybox, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  /*
   * All the variables that go into our skybox shader
   */

  curShaderProgram = shaderProgramSkybox;
  gl.useProgram(shaderProgramSkybox);

  shaderProgramSkybox.vertexPositionAttribute = gl.getAttribLocation(shaderProgramSkybox, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgramSkybox.vertexPositionAttribute);

  shaderProgramSkybox.vertexNormalAttribute = gl.getAttribLocation(shaderProgramSkybox, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgramSkybox.vertexNormalAttribute);

  shaderProgramSkybox.mvMatrixUniform = gl.getUniformLocation(shaderProgramSkybox, "uMVMatrix");
  shaderProgramSkybox.pMatrixUniform = gl.getUniformLocation(shaderProgramSkybox, "uPMatrix");
  shaderProgramSkybox.nMatrixUniform = gl.getUniformLocation(shaderProgramSkybox, "uNMatrix");
  shaderProgramSkybox.uniformTextureLoc = gl.getUniformLocation(shaderProgramSkybox, 'uTexture');

  /*
   * All the shader variables that go into our teapot shader
   */

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.mMatrixUniform = gl.getUniformLocation(shaderProgram, "uMMatrix");
  shaderProgram.vMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
  shaderProgram.uniformShininessLoc = gl.getUniformLocation(shaderProgram, "uShininess");
  shaderProgram.uniformAmbientMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKAmbient");
  shaderProgram.uniformDiffuseMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKDiffuse");
  shaderProgram.uniformSpecularMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKSpecular");
  shaderProgram.uniformTextureLoc = gl.getUniformLocation(shaderProgram, 'uTexture');
  shaderProgram.uniformCameraLoc = gl.getUniformLocation(shaderProgram, 'w_camPosition');
  shaderProgram.uniformRenderType = gl.getUniformLocation(shaderProgram, 'uRenderType');
}

//-------------------------------------------------------------------------
/**
 * Allow the user to switch the currently used shader
 */
function switchShaders(shader) {
  curShaderProgram = shader;
  gl.useProgram(shader);
}

//-------------------------------------------------------------------------
/**
 * Sends material information to the shader
 * @param {Float32} alpha shininess coefficient
 * @param {Float32Array} a Ambient material color
 * @param {Float32Array} d Diffuse material color
 * @param {Float32Array} s Specular material color
 */
function setMaterialUniforms(alpha,a,d,s) {
  gl.uniform1f(curShaderProgram.uniformShininessLoc, alpha);
  gl.uniform3fv(curShaderProgram.uniformAmbientMaterialColorLoc, a);
  gl.uniform3fv(curShaderProgram.uniformDiffuseMaterialColorLoc, d);
  gl.uniform3fv(curShaderProgram.uniformSpecularMaterialColorLoc, s);
}

//-------------------------------------------------------------------------
/**
 * Sends light information to the shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} s Specular light strength
 */
function setLightUniforms(loc,a,d,s) {
  gl.uniform3fv(curShaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(curShaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(curShaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(curShaderProgram.uniformSpecularLightColorLoc, s);
}

//----------------------------------------------------------------------------------
/**
 * Populate buffers with data
 */
function setupMesh(filename) {
   //Your code here
   myMesh = new TriMesh();
   myPromise = asyncGetFile(filename);
   myPromise.then((retrievedText) => {
     myMesh.loadFromOBJ(retrievedText);
     console.log("Yay! got the file!");
   })
   .catch(
     // Rejection reeason
     (reason) => {
       console.log("Handle rejected promise ("+reason+") here.");
     }
   );
}

//-------------------------------------------------------------------------
/**
 * Change the camera position and direction based on user input
 */
function calculateCamera(yAngle) {
  let yAngleRad = degToRad(yAngle)
  eyePt = vec3.fromValues(5*Math.sin(yAngleRad), 0.0, 5*Math.cos(yAngleRad));
  viewDir = vec3.fromValues(-Math.sin(yAngleRad), 0.0, -Math.cos(yAngleRad));
}

//----------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to the skybox and draws it on the screen
 */
function drawSkybox() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective
    mat4.perspective(pMatrix,degToRad(90),
                     gl.viewportWidth / gl.viewportHeight,
                     0.1, 500.0);

    // We want to look down -z, so create a lookat point in that direction
    calculateCamera(eulerY);
    vec3.add(viewPt, eyePt, viewDir);

    // Then generate the lookat matrix and initialize the view matrix to that view
    mat4.lookAt(vMatrix,eyePt,viewPt,up);

    // Ensure the textures are loaded
    if (!loadTexture) return;
    mvPushMatrix();
    mat4.multiply(mvMatrix,vMatrix,mvMatrix);
    setMatrixUniforms();

    // Draw the skybox to the screen
    mySkybox.drawTriangles();
    mvPopMatrix();
}

//----------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function drawModel() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

    // We'll use perspective
    mat4.perspective(pMatrix,degToRad(90),
                     gl.viewportWidth / gl.viewportHeight,
                     0.1, 500.0);

    // We want to look down -z, so create a lookat point in that direction
    calculateCamera(eulerY);
    vec3.add(viewPt, eyePt, viewDir);

    // Then generate the lookat matrix and initialize the view matrix to that view
    mat4.lookAt(vMatrix,eyePt,viewPt,up);

    //Draw Mesh
    if (!myMesh.loaded()) return;
    mvPushMatrix();
    mat4.rotateY(mvMatrix, mvMatrix, degToRad(potRotation));
    mMatrix = mvMatrix;
    // Upload separate model and view matrices
    uploadMatrices(mvMatrix, vMatrix);
    mat4.multiply(mvMatrix,vMatrix,mvMatrix);
    setMatrixUniforms();
    setLightUniforms(lightPosition,lAmbient,lDiffuse,lSpecular);

    // Check render type
    if (document.getElementById("reflection").checked)
    {
      renderType = 0;
    }

    if(document.getElementById("refraction").checked)
    {
      renderType = 1;
    }
    // Upload lighting variables if its blinn phong
    if(document.getElementById("phong").checked)
    {
      renderType = 2;
      setMaterialUniforms(shininess,kAmbient,
                          kTerrainDiffuse,kSpecular);
    }

    // Draw mesh
    setRenderType();
    myMesh.drawTriangles();
    mvPopMatrix();
}

//----------------------------------------------------------------------------------
//Code to handle user interaction
var currentlyPressedKeys = {};

function handleKeyDown(event) {
        //console.log("Key down ", event.key, " code ", event.code);
        currentlyPressedKeys[event.key] = true;
          if (currentlyPressedKeys["a"]) {
            // key A
            eulerY-= 1;
        } else if (currentlyPressedKeys["d"]) {
            // key D
            eulerY+= 1;
        }

        if (currentlyPressedKeys["ArrowLeft"]){
            // Up cursor key
            event.preventDefault();
            potRotation -= 1;
        } else if (currentlyPressedKeys["ArrowRight"]){
            event.preventDefault();
            // Down cursor key
            potRotation += 1;
        }

}

function handleKeyUp(event) {
        //console.log("Key up ", event.key, " code ", event.code);
        currentlyPressedKeys[event.key] = false;
}

//----------------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders();
  createTexture(gl);
  uploadTexture();
  setupMesh("teapot.obj");
  mySkybox = new Skybox();
  mySkybox.generateCube();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;
  tick();
}


//----------------------------------------------------------------------------------
/**
  * Update any model transformations
  */
function animate() {
   //console.log(eulerX, " ", eulerY, " ", eulerZ);
   document.getElementById("eY").value=eulerY;
   document.getElementById("eZ").value=eyePt[2];
}


//----------------------------------------------------------------------------------
/**
 * Keeping drawing frames....
 */
function tick() {
    requestAnimFrame(tick);
    animate();
    switchShaders(shaderProgramSkybox);
    drawSkybox();
    switchShaders(shaderProgram);
    drawModel();
}
