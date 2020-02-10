//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function initBuffers(gl, vertices, colors, framenum) {

  // Create a buffer for the square's positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the square.

  var positions = vertices;
  positions = deform_model(positions, framenum);

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(positions),
                gl.DYNAMIC_DRAW);

  let aVertexColorO = [1.0, 0.5, 0.0, 1.0];
  let aVertexColorB = [0.0353, 0.0, 0.529, 1.0];
  const vertexColorBuffer= gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);

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

function animate_model(modelViewMatrix, framenum) {
  mat4.fromRotation(modelViewMatrix, .01*framenum, [Math.sin(framenum*.001), Math.sin(framenum*.01), .7]);
  mat4.scale(modelViewMatrix,  modelViewMatrix, [.3*Math.sin(framenum*.01)+.5,.3*Math.sin(framenum*.01)+.5,.3*Math.sin(framenum*.01)+.5]);

  return modelViewMatrix;
}

function deform_model(vertices, framenum) {
  for(i = 0; i < vertices.length; i++) {
    vertices[i] = vertices[i] + (i%3)*(1/10)*Math.sin(framenum*.05);
    i++;
  }
  return vertices;
}

function drawObject(gl, programInfo, buffers, num_verts, framenum) {

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  animate_model(modelViewMatrix, framenum);

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  {
    const numComponents = 2;  // pull out 2 values per iteration
    const type = gl.FLOAT;    // the data in the buffer is 32bit floats
    const normalize = false;  // don't normalize
    const stride = 0;         // how many bytes to get from one set of values to the next
                              // 0 = use type and numComponents above
    const offset = 0;         // how many bytes inside the buffer to start from
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

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);


  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

  {
    const offset = 0;
    const vertexCount = num_verts;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
}

// Scales vertices to range -1,1
function scaleVertices(vertices, max_xy) {
  for(i = 0; i < vertices.length; i++) {
    vertices[i] = (vertices[i] - 0) * (1 - (-1)) / (25 - 0) + -1;
    i++;
    vertices[i] = (vertices[i] - 0) * (-1 - (1)) / (25 - 0) + 1;
  }
  return vertices;
}

function drawLargeI(gl, programInfo, framenum) {
  // Top box
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

  vertices = scaleVertices(vertices, 25); // Scale
  // console.log(vertices);
  // Build and draw buffer
  let buffers = initBuffers(gl, vertices, 1, framenum);
  drawObject(gl, programInfo, buffers, 14, framenum);
}

function drawSmallI(gl, programInfo, framenum) {
  // Top box
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

  vertices = scaleVertices(vertices, 25); // Scale
  // console.log(vertices);
  // Build and draw buffer
  let buffers = initBuffers(gl, vertices, 0, framenum);
  drawObject(gl, programInfo, buffers, 14, framenum);
}

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

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
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
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
  };

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

  function animate() {
    requestAnimationFrame(animate);
    drawLargeI(gl, programInfo, framenum);
    drawSmallI(gl, programInfo, framenum);
    framenum+=1;
  }

  animate();

}

window.onload = main;
