
/** Class implementing a skybox model. */
class Skybox{
/**
 * Initialize members of a Skybox object
 */
    constructor(){
        this.isLoaded = false;
        this.minXYZ=[0,0,0];
        this.maxXYZ=[0,0,0];

        this.numFaces=0;
        this.numVertices=0;

        // Allocate vertex array
        this.vBuffer = [];
        // Allocate triangle array
        this.fBuffer = [];
        // Allocate normal array
        this.nBuffer = [];
        // Allocate array for edges so we can draw wireframe
        this.eBuffer = [];
        // Allocate  array for texture coordinates
        this.texcoordBuffer = [];

        console.log("Skybox: Allocated buffers");

        // Get extension for 4 byte integer indices for drawElements
        var ext = gl.getExtension('OES_element_index_uint');
        if (ext ==null){
            alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
        }
        else{
            console.log("OES_element_index_uint is supported!");
        }
    }

    /**
    * Return if the JS arrays have been populated with mesh data
    */
    loaded(){
        return this.isLoaded;
    }

    /**
    * Generate model for a cube
    */
    generateCube()
    {
        var maxXYZ = [10,10,10];
        var minXYZ = [-10,-10,-10];

        var verts = 8;
        var faces = 12;

        // Push data for cube to the vertex and face buffers
        this.vBuffer.push(maxXYZ[0], maxXYZ[1], maxXYZ[2]);
        this.vBuffer.push(minXYZ[0], minXYZ[1], minXYZ[2]);
        this.vBuffer.push(maxXYZ[0], maxXYZ[1], minXYZ[2]);
        this.vBuffer.push(maxXYZ[0], minXYZ[1], minXYZ[2]);
        this.vBuffer.push(minXYZ[0], minXYZ[1], maxXYZ[2]);
        this.vBuffer.push(minXYZ[0], maxXYZ[1], maxXYZ[2]);
        this.vBuffer.push(minXYZ[0], maxXYZ[1], minXYZ[2]);
        this.vBuffer.push(maxXYZ[0], minXYZ[1], maxXYZ[2]);

        this.fBuffer.push(0,3,2);
        this.fBuffer.push(0,7,3);
        this.fBuffer.push(0,5,4);
        this.fBuffer.push(0,4,7);
        this.fBuffer.push(1,5,6);
        this.fBuffer.push(1,4,5);
        this.fBuffer.push(1,6,2);
        this.fBuffer.push(1,2,3);
        this.fBuffer.push(0,2,6);
        this.fBuffer.push(0,6,5);
        this.fBuffer.push(1,7,4);
        this.fBuffer.push(1,3,7);

        //----------------
        console.log("Skybox: Loaded ", this.numFaces, " triangles.");
        console.log("Skybox: Loaded ", this.numVertices, " vertices.");

        this.generateNormals();
        console.log("Skybox: Generated normals");

        mySkybox.loadBuffers();
        this.isLoaded = true;
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
        console.log("Loaded ", this.IndexTriBuffer.numItems/3, " triangles");

        //Setup Edges
        this.IndexEdgeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.eBuffer),
                  gl.STATIC_DRAW);
        this.IndexEdgeBuffer.itemSize = 1;
        this.IndexEdgeBuffer.numItems = this.eBuffer.length;
    }

    /**
    * Render the triangles
    */
    drawTriangles(){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(curShaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize,
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(curShaderProgram.vertexNormalAttribute,
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);

        //Draw
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
    }


/**
* Set the x,y,z coords of a vertex at location id
* @param {number} the index of the vertex to set
* @param {number} x coordinate
* @param {number} y coordinate
* @param {number} z coordinate
*/
setVertex(id,x,y,z){
    var vid = 3*id;
    this.vBuffer[vid]=x;
    this.vBuffer[vid+1]=y;
    this.vBuffer[vid+2]=z;
}

/**
* Return the x,y,z coords of a vertex at location id
* @param {number} the index of the vertex to return
* @param {Object} a length 3 array to populate withx,y,z coords
*/
getVertex(id, v){
    var vid = 3*id;
    v[0] = this.vBuffer[vid];
    v[1] = this.vBuffer[vid+1];
    v[2] = this.vBuffer[vid+2];
}

/**
* Compute per-vertex normals for a mesh
*/
generateNormals(){
    //per vertex normals
    this.numNormals = this.numVertices;
    this.nBuffer = new Array(this.numNormals*3);

    for(var i=0;i<this.nBuffer.length;i++)
        {
            this.nBuffer[i]=0;
        }

    for(var i=0;i<this.numFaces;i++)
        {
            // Get vertex coodinates
            var v1 = this.fBuffer[3*i];
            var v1Vec = vec3.fromValues(this.vBuffer[3*v1], this.vBuffer[3*v1+1],                                           this.vBuffer[3*v1+2]);
            var v2 = this.fBuffer[3*i+1];
            var v2Vec = vec3.fromValues(this.vBuffer[3*v2], this.vBuffer[3*v2+1],                                           this.vBuffer[3*v2+2]);
            var v3 = this.fBuffer[3*i+2];
            var v3Vec = vec3.fromValues(this.vBuffer[3*v3], this.vBuffer[3*v3+1],                                           this.vBuffer[3*v3+2]);

           // Create edge vectors
            var e1=vec3.create();
            vec3.subtract(e1,v2Vec,v1Vec);
            var e2=vec3.create();
            vec3.subtract(e2,v3Vec,v1Vec);

            // Compute  normal
            var n = vec3.fromValues(0,0,0);
            vec3.cross(n,e1,e2);

            // Accumulate
            for(var j=0;j<3;j++){
                this.nBuffer[3*v1+j]+=n[j];
                this.nBuffer[3*v2+j]+=n[j];
                this.nBuffer[3*v3+j]+=n[j];
            }

        }
    for(var i=0;i<this.numNormals;i++)
        {
            var n = vec3.fromValues(this.nBuffer[3*i],
                                    this.nBuffer[3*i+1],
                                    this.nBuffer[3*i+2]);
            vec3.normalize(n,n);
            this.nBuffer[3*i] = n[0];
            this.nBuffer[3*i+1]=n[1];
            this.nBuffer[3*i+2]=n[2];
        }
}


}
