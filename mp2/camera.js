
// This class entirely controls the camera
class Camera {
  constructor() {
    // View parameters
    /** Location of the camera in world coordinates */
    this.eyePt = glMatrix.vec3.fromValues(0.0,0.1,0.5);
    /** Direction of the view in world coordinates */
    this.viewDir = glMatrix.vec3.fromValues(0,0,-1.0);
    /** Up vector for view matrix creation, in world coordinates */
    this.up = glMatrix.vec3.fromValues(0.0,1.0,0.0);
    /** Location of a point along viewDir in world coordinates */
    this.viewPt = glMatrix.vec3.fromValues(0.0,0.0,0.0);

    // angle data
    this.pitchAngle = 0.0;
    this.rollAngle = 0.0;
    // movement speed
    this.speed = 0.0002;
  }

  get rollAngle() {
    return this._rollAngle;
  }

  set rollAngle(value) {
    this._rollAngle = value;
  }

  get pitchAngle() {
    return this._pitchAngle;
  }

  set pitchAngle(value) {
    this._pitchAngle = value;
  }

  get speed(){
    return this._speed;
  }

  set speed(value) {
    this._speed = value;
  }

  // This updates the camera angle and position based on the angle parameters, and then sets them back to zero
  updateCamera() {
    this.rotateCamera();
    this.translateCamera();
    this._rollAngle = 0.0;
    this._pitchAngle = 0.0
  }

  // This updates the camera position by translating the eye point
  translateCamera() {
    let translation = glMatrix.vec3.fromValues(0.0,0.0,0.0);
    glMatrix.vec3.scale(translation, this.viewDir, this._speed);
    glMatrix.vec3.add(this.eyePt, this.eyePt, translation);
  }

  // This rotates the camera based on the inputted roll and pitch angles
  rotateCamera() {
    // Set up vector based on roll
    let cRoll = Math.cos(this.rollAngle*Math.PI/(180*2));
    let qRoll = [this.viewDir[0]*Math.sin(this.rollAngle*Math.PI/(180*2)), this.viewDir[1]*Math.sin(this.rollAngle*Math.PI/(180*2)), this.viewDir[2]*Math.sin(this.rollAngle*Math.PI/(180*2))]
    let rollQuat = glMatrix.quat.fromValues(qRoll[0], qRoll[1], qRoll[2], cRoll);

    // adjust up vector based on quaternion
    glMatrix.vec3.transformQuat(this.up, this.up, rollQuat);

    // Set up_vector and viewDir based on pitch

    // get cross product vector
    let crossProd = glMatrix.vec3.fromValues(0.0,0.0,0.0);
    glMatrix.vec3.cross(crossProd,this.viewDir,this.up);

    // set up quaternion
    let cPitch = Math.cos(this.pitchAngle*Math.PI/(180*2));
    let qPitch = [crossProd[0]*Math.sin(this.pitchAngle*Math.PI/(180*2)), crossProd[1]*Math.sin(this.pitchAngle*Math.PI/(180*2)), crossProd[2]*Math.sin(this.pitchAngle*Math.PI/(180*2))]
    let pitchQuat = glMatrix.quat.fromValues(qPitch[0], qPitch[1], qPitch[2], cPitch);

    //Set vectors based on the Quaternion
    glMatrix.vec3.transformQuat(this.up, this.up, pitchQuat);
    glMatrix.vec3.transformQuat(this.viewDir, this.viewDir, pitchQuat);
  }

  // Generates the lookat vector and pushes it to the matrix stack
  pushViewMatrix() {
    // We want to look down -z, so create a lookat point in that direction
    glMatrix.vec3.add(this.viewPt, this.eyePt, this.viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    glMatrix.mat4.lookAt(mvMatrix,this.eyePt,this.viewPt,this.up);
    // lightPosition = staticLightPos*mvMatrix;
    //Draw Terrain
    mvPushMatrix();
  }
};
