/**
 * @fileoverview Terrain - A simple 3D terrain using WebGL
 * @author Eric Shaffer
 */

/** Class implementing 3D terrain. */
class Terrain{
/**
 * Initialize members of a Terrain object
 * @param {number} div Number of triangles along x axis and y axis
 * @param {number} minX Minimum X coordinate value
 * @param {number} maxX Maximum X coordinate value
 * @param {number} minY Minimum Y coordinate value
 * @param {number} maxY Maximum Y coordinate value
 */
    constructor(div,minX,maxX,minY,maxY){
        this.div = div;
        this.minX=minX;
        this.minY=minY;
        this.maxX=maxX;
        this.maxY=maxY;

        // Allocate vertex array
        this.vBuffer = [];
        // Allocate triangle array
        this.fBuffer = [];
        // Allocate normal array
        this.nBuffer = [];
        // Allocate array for edges so we can draw wireframe
        this.eBuffer = [];
        console.log("Terrain: Allocated buffers");

        this.generateTriangles();
        console.log("Terrain: Generated triangles");

        // This generates all of the topology
        this.generateTerrain(.005, 100);
        console.log("Terrain: Generated random terrain");

        this.generateLines();
        console.log("Terrain: Generated lines");

        // Get extension for 4 byte integer indices for drwElements
        var ext = gl.getExtension('OES_element_index_uint');
        if (ext ==null){
            alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
        }
    }

    /**
    * Set the x,y,z coords of a vertex at location(i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    setVertex(v,i,j)
    {
      // Turn into 1D Array index and set the 3 vertex values
      var vid = 3*(i*(this.div+1)+j);
      this.vBuffer[vid] = v[0];
      this.vBuffer[vid+1] = v[1];
      this.vBuffer[vid+2] = v[2];
    }

    /**
    * Return the x,y,z coordinates of a vertex at location (i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    getVertex(v,i,j)
    {
        // Turn into 1D Array index and select the 3 vertex values
        var vid = 3*(i*(this.div+1)+j);
        v[0] = this.vBuffer[vid];
        v[1] = this.vBuffer[vid+1];
        v[2] = this.vBuffer[vid+2];
    }

    /**
    * Set the x,y,z coords of a vertex at location(i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    setNormal(v,i,j)
    {
      // Turn into 1D Array index and set the 3 vector values
      var vid = 3*(i*(this.div+1)+j);
      this.nBuffer[vid] = v[0];
      this.nBuffer[vid+1] = v[1];
      this.nBuffer[vid+2] = v[2];
    }

    /**
    * Return the x,y,z coordinates of a vertex at location (i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    getNormal(v,i,j)
    {
        // Turn into 1D Array index and select the 3 vector values
        var vid = 3*(i*(this.div+1)+j);
        v[0] = this.nBuffer[vid];
        v[1] = this.nBuffer[vid+1];
        v[2] = this.nBuffer[vid+2];
    }

    /**
    * Send the buffer objects to WebGL for rendering
    */
    loadBuffers()
    {
        // Specify the vertex coordinates
        this.VertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vBuffer), gl.STATIC_DRAW);
        this.VertexPositionBuffer.itemSize = 3;
        this.VertexPositionBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexPositionBuffer.numItems, " vertices");

        // Specify normals to be able to do lighting calculations
        this.VertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.nBuffer),
                  gl.STATIC_DRAW);
        this.VertexNormalBuffer.itemSize = 3;
        this.VertexNormalBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexNormalBuffer.numItems, " normals");

        // Specify faces of the terrain
        this.IndexTriBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.fBuffer),
                  gl.STATIC_DRAW);
        this.IndexTriBuffer.itemSize = 1;
        this.IndexTriBuffer.numItems = this.fBuffer.length;
        console.log("Loaded ", this.IndexTriBuffer.numItems, " triangles");

        //Setup Edges
        this.IndexEdgeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.eBuffer),
                  gl.STATIC_DRAW);
        this.IndexEdgeBuffer.itemSize = 1;
        this.IndexEdgeBuffer.numItems = this.eBuffer.length;

        console.log("triangulatedPlane: loadBuffers");
    }

    /**
    * Render the triangles
    */
    drawTriangles(){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize,
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute,
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);

        //Draw
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
    }

    /**
    * Render the triangle edges wireframe style
    */
    drawEdges(){

        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize,
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute,
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);

        //Draw
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.drawElements(gl.LINES, this.IndexEdgeBuffer.numItems, gl.UNSIGNED_INT,0);
    }
/**
 * Fill the vertex and buffer arrays
 */
generateTriangles()
{
    // Calculate the distance between each vertex
    var deltaX = (this.maxX-this.minX)/this.div;
    var deltaY = (this.maxY-this.minY)/this.div;

    // Push each vertex and normal vector to the buffer
    for(var i=0; i<=this.div; i++) {
      for(var j=0; j<=this.div; j++) {
        this.vBuffer.push(this.minX+deltaX*j);
        this.vBuffer.push(this.minY+deltaY*i);
        this.vBuffer.push(0);

        this.nBuffer.push(0);
        this.nBuffer.push(0);
        this.nBuffer.push(1);
      }
    }

    // Loop through each square and split into two triangles
    // Push triangle vertices to face buffer
    for(var i=0; i<this.div; i++) {
      for(var j=0; j<this.div; j++) {
        var vid = i*(this.div+1) + j;
        this.fBuffer.push(vid);
        this.fBuffer.push(vid+1);
        this.fBuffer.push(vid+this.div+1);

        this.fBuffer.push(vid+1);
        this.fBuffer.push(vid+1+this.div+1);
        this.fBuffer.push(vid+this.div+1);
      }
    }

    this.numVertices = this.vBuffer.length/3;
    this.numFaces = this.fBuffer.length/3;
}

// Calculate the dot product of 2 vectors from 3 points
// a - the selected vertex on the square
// p - the random point chosen to split the square
// n - the normal point on the unit circle
dotProduct(a,p,n)
{
  // A~ vector
  let vecA = [0,0];
  vecA[0] = a[0] - p[0];
  vecA[1] = a[1] - p[1];

  // N~ vector
  let vecN = [0,0];
  vecN[0] = n[0] - p[0];
  vecN[1] = n[1] - p[1];

  let result = vecA[0]*vecN[0] + vecA[1]*vecN[1];
  return result;
}

// This randomizes the z values on the terrain and updates their normal vectors
// This uses the randomization algorithm specified in the MP spec
generateTerrain(delta, iterations)
{
  this.randomizeTerrainVerts(delta, iterations);
  this.updateTerrainNormals();
}

// This randomizes the z values in the vertex buffer according to the randomizaton algorithm
// delta - the change in elevation for each iteration
// iterations - the amount of times the algorithm should be run
randomizeTerrainVerts(delta, iterations)
{
  let pos = 0;
  let neg = 0;
  for(var k=0; k<iterations; k++) {
    // This is a random point on the square
    var p = [0,0];
    // This is our normal vector
    var n = [0,0];

    // Randomize values
    p[0] = Math.random()*(this.maxX-this.minX)+this.minX;
    p[1] = Math.random()*(this.maxX-this.minX)+this.minX;

    // Select point on unit circle
    var theta = 2*Math.PI*Math.random();
    n[0] = Math.cos(theta);
    n[1] = Math.sin(theta);


    // Loop through each vertex and calculate the dot product
    for(var i=0; i<=this.div; i++) {
      for(var j=0; j<=this.div; j++) {
        let v = [0,0,0];
        this.getVertex(v,i,j);
        // console.log(v);
        let dot_prod = this.dotProduct([v[0],v[1]],p,n);

        // increase elevation if on one side
        if (dot_prod > 0.0) {
          v[2] += delta;
          pos += 1;
        }
        // otherwise decrease elevaation if on other side
        else if (dot_prod < 0.0) {
          v[2] -= delta;
          neg += 1;
        }

        this.setVertex(v,i,j);
      }
    }
  }
  console.log(pos,neg);
}

// Loop through each triangle and calculate the vertex normal for the shading algorithm.
updateTerrainNormals()
{
  // Reset normals to [0,0,0]
  for(var i=0; i<this.div; i++) {
    for(var j=0; j<this.div; j++) {
      let n = [0,0,0];
      this.setNormal(n,i,j);
    }
  }

  // Loop through each square
  for(var i=0; i<this.div; i++) {
    for(var j=0; j<this.div; j++) {
      let v1 = [0,0,0];
      let v2 = [0,0,0];
      let v3 = [0,0,0];

      let n1 = [0,0,0];
      let n2 = [0,0,0];
      let n3 = [0,0,0];

      // iterate through each triangle face
      // Bottom left triangle
      this.getVertex(v1,i,j);
      this.getVertex(v2,i,j+1);
      this.getVertex(v3,i+1,j);
      this.getNormal(n1,i,j);
      this.getNormal(n2,i,j+1);
      this.getNormal(n3,i+1,j);

      // Calculate big N value and add to each normal
      let bigN = this.crossProduct(v1, v2, v3);
      n1[0] += bigN[0];n1[1] += bigN[1];n1[2] += bigN[2];
      n2[0] += bigN[0];n2[1] += bigN[1];n2[2] += bigN[2];
      n3[0] += bigN[0];n3[1] += bigN[1];n3[2] += bigN[2];

      this.setNormal(n1,i,j);
      this.setNormal(n2,i,j+1);
      this.setNormal(n3,i+1,j);

      // iterate through each triangle face
      // Repeat for the top right triangle
      this.getVertex(v1,i,j+1);
      this.getVertex(v2,i+1,j+1);
      this.getVertex(v3,i,j+1);
      this.getNormal(n1,i,j+1);
      this.getNormal(n2,i+1,j+1);
      this.getNormal(n3,i,j+1);

      bigN = this.crossProduct(v1, v2, v3);
      n1[0] += bigN[0];n1[1] += bigN[1];n1[2] += bigN[2];
      n2[0] += bigN[0];n2[1] += bigN[1];n2[2] += bigN[2];
      n3[0] += bigN[0];n3[1] += bigN[1];n3[2] += bigN[2];

      this.setNormal(n1,i,j+1);
      this.setNormal(n2,i+1,j+1);
      this.setNormal(n3,i,j+1);
    }
  }

  // Normalize all the vectors
  for(var i=0; i<this.div; i++) {
    for(var j=0; j<this.div; j++) {
      let n = [0,0,0];
      this.getNormal(n,i,j);
      n = this.normalize(n);
      this.setNormal(n,i,j)
    }
  }
}

// This function normalizes the vecotrs
// v[3] - vector to be normalized
normalize(v)
{
  let magnitude = v[0]*v[0] + v[1]*v[1] + v[2]*v[2];
  magnitude = Math.sqrt(magnitude);

  v[0] = v[0]/magnitude;
  v[1] = v[1]/magnitude;
  v[2] = v[2]/magnitude;

  return v;
}

// Calculates cross product of the vertices in a triangle
// v1,v2,v3 - counter clockwise vertices in a triangle
crossProduct(v1,v2,v3)
{
  var bigN = [0.0,0.0,0.0];
  var vecA = [0.0,0.0,0.0];
  var vecB = [0.0,0.0,0.0];


  // Split into 2 vectors
  vecA[0] = v2[0]-v1[0];
  vecA[1] = v2[1]-v1[1];
  vecA[2] = v2[2]-v1[2];

  vecB[0] = v3[0]-v1[0];
  vecB[1] = v3[1]-v1[1];
  vecB[2] = v3[2]-v1[2];

  // Calculate big N
  bigN[0] = vecA[1]*vecB[2]-vecA[2]*vecB[1];
  bigN[1] = vecA[2]*vecB[0]-vecA[0]*vecB[2];
  bigN[2] = vecA[0]*vecB[1]-vecA[1]*vecB[0];

  return bigN;
}

/**
 * Print vertices and triangles to console for debugging
 */
printBuffers()
    {

    for(var i=0;i<this.numVertices;i++)
          {
           console.log("v ", this.vBuffer[i*3], " ",
                             this.vBuffer[i*3 + 1], " ",
                             this.vBuffer[i*3 + 2], " ");

          }

      for(var i=0;i<this.numFaces;i++)
          {
           console.log("f ", this.fBuffer[i*3], " ",
                             this.fBuffer[i*3 + 1], " ",
                             this.fBuffer[i*3 + 2], " ");

          }

    }

/**
 * Generates line values from faces in faceArray
 * to enable wireframe rendering
 */
generateLines()
{
    var numTris=this.fBuffer.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        this.eBuffer.push(this.fBuffer[fid]);
        this.eBuffer.push(this.fBuffer[fid+1]);

        this.eBuffer.push(this.fBuffer[fid+1]);
        this.eBuffer.push(this.fBuffer[fid+2]);

        this.eBuffer.push(this.fBuffer[fid+2]);
        this.eBuffer.push(this.fBuffer[fid]);
    }

}

}
