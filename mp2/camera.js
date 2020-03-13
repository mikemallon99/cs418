class Camera {
  constructor() {
    // View parameters
    /** Location of the camera in world coordinates */
    this.eyePt = glMatrix.vec3.fromValues(0.0,0.0,1.0);
    /** Direction of the view in world coordinates */
    this.viewDir = glMatrix.vec3.fromValues(0,0,-1.0);
    /** Up vector for view matrix creation, in world coordinates */
    this.up = glMatrix.vec3.fromValues(0.0,1.0,0.0);
    /** Location of a point along viewDir in world coordinates */
    this.viewPt = glMatrix.vec3.fromValues(0.0,0.0,0.0);

    /** Location of the camera in world coordinates */
    this.eyePtOut = glMatrix.vec3.fromValues(0.0,0.0,1.0);
    /** Direction of the view in world coordinates */
    this.viewDirOut = glMatrix.vec3.fromValues(0,0,-1.0);
    /** Up vector for view matrix creation, in world coordinates */
    this.upOut = glMatrix.vec3.fromValues(0.0,1.0,0.0);
    /** Location of a point along viewDir in world coordinates */
    this.viewPt = glMatrix.vec3.fromValues(0.0,0.0,0.0);

    // angle data
    this.pitchAngle = 0.0;
    this.rollAngle = 0.0;
  }

  get rollAngle() {
    return this._rollAngle;
  }

  set rollAngle(value) {
    this._rollAngle = value;
  }

  rotateCamera() {
    let cRoll = Math.cos(this.rollAngle*Math.PI/180);
    let qRoll = [this.viewDir[0]*Math.sin(this.rollAngle*Math.PI/180), this.viewDir[1]*Math.sin(this.rollAngle*Math.PI/180), this.viewDir[2]*Math.sin(this.rollAngle*Math.PI/180)]
    let rollQuat = glMatrix.quat.fromValues(cRoll, qRoll[0], qRoll[1], qRoll[2]);

    glMatrix.vec3.transformQuat(this.upOut, this.up, rollQuat);
    console.log(glMatrix.quat.str(rollQuat));
  }

  pushViewMatrix() {
    // We want to look down -z, so create a lookat point in that direction
    glMatrix.vec3.add(this.viewPt, this.eyePt, this.viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    glMatrix.mat4.lookAt(mvMatrix,this.eyePt,this.viewPt,this.upOut);
    //Draw Terrain
    mvPushMatrix();
  }
};
