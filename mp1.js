/*
 * Initializes the shader program given the source code string for
 * a vertex shader and a fragment shader.
 */
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create shader program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  // Send the program to the user
  return shaderProgram;
}

/*
 * Creates a new shader given its type and its source code string.
 * Returns the shader to the user
 */
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Grab the source code and compile it
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  // Check for successful compilation
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

/*
 * Takes a collection of vertices and compiles it into a buffer.
 * color: 0 - orange polygon
 *        1 - blue polygon
 */
function initBuffers(gl, vertices, colors, framenum) {

  // Create a buffer to hold vertex data and bind to the context
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Copy the vertices given
  var positions = vertices;

  // Place the vertex data into the buffer
  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(positions),
                gl.DYNAMIC_DRAW);

  // Next construct the buffers for the color data
  // We only need two different colors since were just drawing the UIUC logo
  let aVertexColorO = [1.0, 0.5, 0.0, 1.0];
  let aVertexColorB = [0.0353, 0.0, 0.529, 1.0];
  const vertexColorBuffer= gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);

  // Create an array that holds all the color data for each vertex
  let color_matrix = [];

  if (colors == 0) {
    for (i = 0; i < vertices.length; i++) {
      for(j = 0; j < 4; j++) {
        color_matrix.push(aVertexColorO[j]);
      }
    }
  }
  else if (colors == 1) {
    for (i = 0; i < vertices.length; i++) {
      for(j = 0; j < 4; j++) {
        color_matrix.push(aVertexColorB[j]);
      }
    }
  }

  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(color_matrix),
                gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    colors: vertexColorBuffer,
  };
}

/*
 * This function takes in a modelViewMatrix and constructs it so it can
 * scale and rotate a model
 */
function animate_model(modelViewMatrix, framenum) {
  glMatrix.mat4.fromRotation(modelViewMatrix, .01*framenum, [Math.sin(framenum*.001), Math.sin(framenum*.01), .7]);
  glMatrix.mat4.scale(modelViewMatrix,  modelViewMatrix, [.3*Math.sin(framenum*.01)+.5,.3*Math.sin(framenum*.01)+.5,.3*Math.sin(framenum*.01)+.5]);

  return modelViewMatrix;
}

/*
 * This function takes in the vertex array directly and modifies it to make the vertexes
 * "wiggle" from left to right in a nonuniform manner
 */
function deform_model(vertices, framenum) {
  for(i = 0; i < vertices.length; i++) {
    vertices[i] = vertices[i] + (i%3)*(1/10)*Math.sin(framenum*.05);
    i++;
  }
  return vertices;
}

/*
 * This function is specifically made to draw the "I" logo, however it
 * can draw and animate any triangle strip onto the canvas
 */
function drawObject(gl, programInfo, buffers, num_verts, framenum) {

  // Construct the model view matrix which will be used to animate the I
  const modelViewMatrix = glMatrix.mat4.create();

  animate_model(modelViewMatrix, framenum);

  // Place the vertex informations from the buffers into
  // the vertex and color attributes
  {
    const numComponents = 2;  // 2 values at a time per vertex
    const type = gl.FLOAT;    // all float values
    const normalize = false;  // don't normalize
    const stride = 0;         // space between values
    const offset = 0;         // index offset from start
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);

    // Bind color data, which comes in packages of 4
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colors);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        4,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexColor);
  }

  // Use shader program
  gl.useProgram(programInfo.program);

  // Place our MVM into the shader
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

      // Specify triangle strips
  {
    const offset = 0;
    const vertexCount = num_verts;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
}

/*
 * this function takes in any amount of vertices and scales them down
 * to fit the [-1,1] scale
 */
function scaleVertices(vertices, max_xy) {
  for(i = 0; i < vertices.length; i++) {
    vertices[i] = (vertices[i] - 0) * (1 - (-1)) / (25 - 0) + -1;
    i++;
    vertices[i] = (vertices[i] - 0) * (-1 - (1)) / (25 - 0) + 1;
  }
  return vertices;
}

/*
 * This function fully handles the large I, which is the blue I border
 * This contains the modeling data, and also calls all functions which draw the I
 */
function drawLargeI(gl, programInfo, framenum) {
  // Large I model
  let vertices = [
    0,0, // cc
    0,7, // cl
    20,0, // cc
    20,7, // cl
    20,7, // cc
    4,7, // cl
    16,7, // cc
    4,18, // cl
    16,18,
    16,18,
    20,18,
    0,18,
    20,25,
    0,25
  ];

  // Fit vertices to [-1,1] scale
  vertices = scaleVertices(vertices, 25);
  // Modify vertex buffer for animation
  vertices = deform_model(vertices, framenum);
  // Build and draw buffer
  let buffers = initBuffers(gl, vertices, 1, framenum);
  drawObject(gl, programInfo, buffers, 14, framenum);
}

/*
 * This function is virtually the same as the big I function,
 * however it models and handles the smaller orange I in the logo.
 */
function drawSmallI(gl, programInfo, framenum) {
  // Small I model
  let vertices = [
    1,1, // cc
    1,6, // cl
    19,1, // cc
    19,6, // cl
    19,6, // cc
    5,6, // cl
    15,6, // cc
    5,19, // cl
    15,19,
    15,19,
    19,19,
    1,19,
    19,24,
    1,24
  ];

  // Fit vertices to [-1,1] scale
  vertices = scaleVertices(vertices, 25);
  // Modify vertex buffer for animation
  vertices = deform_model(vertices, framenum);
  // Build and draw buffer
  let buffers = initBuffers(gl, vertices, 0, framenum);
  drawObject(gl, programInfo, buffers, 14, framenum);
}

/*
 * This function creates the movement of the ball when it is bouncing
 * It directly affects the vertex buffer data
 */
function moveCircle(vertices,frequency, framenum) {
  for(i=0; i<vertices.length; i++) {
    i++; //Skip all X values;
    vertices[i] = vertices[i] + 1.8*Math.sin(framenum*frequency)-0.4;
  }
  return vertices;
}

/*
 * This function fully handles the modeling and drawing of the bouncing
 * ball.
 */
function buildCircle(gl, programInfo, framenum) {
  let vertices = [0.0, 0.0];
  var radius = 0.5;
  let numVertices = 100;
  let frequency = .08;

  // Model the circle
  for(i=0; i<=numVertices; i++) {
    let angle = i * 2*3.14159 / numVertices;
    let x = (radius*Math.cos(angle));
    let y = (radius*Math.sin(angle));
    vertices.push(x);
    vertices.push(y);
  }

  // Create the bouncing movement
  vertices = moveCircle(vertices, frequency, framenum);
  // Build buffers and draw circle
  let buffers = initBuffers(gl, vertices, 0, framenum);
  drawCircle(gl, programInfo, buffers, numVertices+2, framenum, frequency);
}

// These global values are used to keep track of keyframe data for the bouncing
// animation used in deform_circle
var orig_framenum = 0;
var peak_val = 0;

/*
 * This function takes in an MVM matrix and deforms it to make
 * the circle appear like it is bouncy
 */
function deform_circle(modelViewMatrix, framenum, frequency) {
  // Scale down the ball
  glMatrix.mat4.scale(modelViewMatrix,  modelViewMatrix, [.5,.5,.5]);

  // Check if the ball should be squashed
  if(Math.sin(framenum*frequency) < -.75) {
    // Unsquash the ball
    if(Math.cos(framenum*frequency) > 0) {
      glMatrix.mat4.scale(modelViewMatrix,  modelViewMatrix, [0.7-0.3*Math.cos(framenum*2*frequency)+Math.pow((11/10),(-(framenum-orig_framenum-peak_val*2)))-1,1,1]);
    }
    // Use exponential growth to make the ball squash
    else {
      glMatrix.mat4.scale(modelViewMatrix,  modelViewMatrix, [0.7-0.3*Math.cos(framenum*2*frequency)+Math.pow((11/10),(framenum-orig_framenum))-1,1,1]);
      peak_val = framenum-orig_framenum
    }
  }
  // Otherwise, stretch the ball to make it look like its going fast
  else {
    orig_framenum = framenum
    glMatrix.mat4.scale(modelViewMatrix,  modelViewMatrix, [0.7-0.3*Math.cos(framenum*2*frequency),1,1]);
  }

  return modelViewMatrix;
}

/*
 * This is very similar to the drawObject function, however it is built to
 * draw and animate triangle fans.
 */
function drawCircle(gl, programInfo, buffers, num_verts, framenum, frequency) {
  // Construct the model view matrix which will be used to animate the I
  const modelViewMatrix = glMatrix.mat4.create();

  deform_circle(modelViewMatrix, framenum, frequency);

  // Place the vertex informations from the buffers into
  // the vertex and color attributes
  {
    const numComponents = 2;  // 2 values at a time per vertex
    const type = gl.FLOAT;    // all float values
    const normalize = false;  // don't normalize
    const stride = 0;         // space between values
    const offset = 0;         // index offset from start
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);

    // Bind color data, which comes in packages of 4
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colors);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        4,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexColor);
  }

  // Use shader program
  gl.useProgram(programInfo.program);

  // Place our MVM into the shader
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

      // Specify triangle fans
  {
    const offset = 0;
    const vertexCount = num_verts;
    gl.drawArrays(gl.TRIANGLE_FAN, offset, vertexCount);
  }
}

// Global variable used to keep track of the framecount
var framenum = 0;

function main() {
  const canvas = document.querySelector("#glCanvas");
  // Initialize the GL context
  const gl = canvas.getContext("webgl");

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  // Vertex shader program

  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    uniform mat4 uModelViewMatrix;
    varying vec4 vColor;
    void main() {
      gl_Position = uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;

  // Fragment shader program

  const fsSource = `
    precision mediump float;
    varying vec4 vColor;
    void main() {
      gl_FragColor = vColor;
    }
  `;

  // Initialize a shader program
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attribute our shader program is using
  // for aVertexPosition and look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexColor:    gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
  };

  // Set clear color to white
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

  /*
   * This function is build to be repeatedly called to animate the
   * UIUC Logo
   */
  function animate_I() {
    drawLargeI(gl, programInfo, framenum);
    drawSmallI(gl, programInfo, framenum);
    framenum+=1;
  }

  /*
   * This function is build to be repeatedly called to animate the
   * bouncing ball
   */
  function animate_Circle() {
    buildCircle(gl, programInfo, framenum);
    framenum+=1;
  }

  /*
   * This function handles calling the respective animation function,
   * and is mostly built to poll the radio checkboxes
   */
  function animate() {
    requestAnimationFrame(animate);
    if (document.getElementById("UIUC").checked == true) {
      animate_I();
    }
    else if (document.getElementById("BALL").checked == true) {
      animate_Circle();
    }
  }

  // This must be called to draw the I
  animate();

  // You can comment out the animate() call and uncomment the two lines below
  // to have a static I
  // drawLargeI(gl, programInfo, framenum);
  // drawSmallI(gl, programInfo, framenum);
}

window.onload = main;
