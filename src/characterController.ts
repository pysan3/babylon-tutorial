import {
  Scene,
  Vector3,
  Ray,
  TransformNode,
  Mesh,
  Color3,
  Color4,
  UniversalCamera,
  Quaternion,
  AnimationGroup,
  ExecuteCodeAction,
  ActionManager,
  ParticleSystem,
  Texture,
  SphereParticleEmitter,
  Sound,
  Observable,
  ShadowGenerator,
  ArcRotateCamera,
  ValueCondition,
  AbstractMesh,
} from '@babylonjs/core';
// import { PlayerInput } from './inputController';

export default class Player extends TransformNode {
  public camera: UniversalCamera;
  public scene: Scene;

  private _input;

  // Player
  public mesh: Mesh; // outer collisionbox of player

  // Camera
  private _camRoot: TransformNode;
  private _yTilt: TransformNode;

  // animations
  private _run: AnimationGroup;
  private _idle: AnimationGroup;
  private _jump: AnimationGroup;
  private _land: AnimationGroup;
  private _dash: AnimationGroup;

  // animation trackers
  private _currentAnim: AnimationGroup | null = null;
  private _prevAnim: AnimationGroup;
  private _isFalling = false;
  private _jumped = false;

  // const values
  private static readonly PLAYER_SPEED: number = 0.45;
  private static readonly JUMP_FORCE: number = 0.8;
  private static readonly GRAVITY: number = -2.8;
  private static readonly DASH_FACTOR: number = 2.5;
  private static readonly DASH_TIME: number = 10; // how many frames the dash lasts
  private static readonly DOWN_TILT: Vector3 = new Vector3(0.8290313946973066, 0, 0);
  private static readonly ORIGINAL_TILT: Vector3 = new Vector3(0.5934119456780721, 0, 0);
  public dashTime = 0;

  // player movement vars
  private _deltaTime = 0;
  private _h: number;
  private _v: number;
  private _moveDirection: Vector3 = new Vector3();
  private _inputAmt: number;
  // dashing
  private _dashPressed: boolean;
  private _canDash = true;

  // gravity, ground detection, jumping
  private _gravity: Vector3 = new Vector3();
  private _lastGroundPos: Vector3 = Vector3.Zero(); // keep track of the last grounded position
  private _grounded: boolean;
  private _jumpCount = 1;

  // player variables
  public lanternsLit = 1; // num lanterns lit
  public totalLanterns: number;
  public win = false; // whether the game is won

  // sparkler
  public sparkler: ParticleSystem; // sparkler particle system
  public sparkLit = true;
  public sparkReset = false;

  // moving platforms
  public _raisePlatform: boolean;

  // sfx
  public lightSfx: Sound;
  public sparkResetSfx: Sound;
  private _resetSfx: Sound;
  private _walkingSfx: Sound;
  private _jumpingSfx: Sound;
  private _dashingSfx: Sound;

  // observables
  public onRun = new Observable();

  // tutorial
  // public tutorial_move;
  // public tutorial_dash;
  // public tutorial_jump;

  constructor(assets: any, scene: Scene, shadowGenerator: ShadowGenerator, input?: any) {
    super('player', scene);
    this.scene = scene;
    this._setupPlayerCamera();

    this.mesh = assets.mesh;
    this.mesh.parent = this;

    this.scene.getLightByName('sparklight')!.parent = this.scene.getTransformNodeByName('Empty');

    shadowGenerator.addShadowCaster(assets.mesh); // the player mesh will cast shadows

    this._input = input; // inputs we will get from inputController.ts
  }

  private _setupPlayerCamera() {
    // root camera parent that handles positioning of the camera to follow the player
    this._camRoot = new TransformNode('root');
    this._camRoot.position = new Vector3(0, 0, 0);
    // to face the player from behind (180 degrees)
    this._camRoot.rotation = new Vector3(0, Math.PI, 0);

    // rotations along the x-axis (up / down)
    const yTilt = new TransformNode('ytilt');
    yTilt.rotation = Player.ORIGINAL_TILT;
    this._yTilt = yTilt;
    yTilt.parent = this._camRoot;

    // our actual camera that is pointing at our root's position
    this.camera = new UniversalCamera('cam', new Vector3(0, 0, -30), this.scene);
    this.camera.lockedTarget = this._camRoot.position;
    this.camera.fov = 0.47350045992678597;
    this.camera.parent = yTilt;

    this.scene.activeCamera = this.camera;
    return this.camera;
  }

  private _updateFromControls(): void {
    // this._moveDirection = Vector3.Zero();
    this._h = this._input.horizontal;
    this._v = this._input.vertical;
    console.log(this._h);
    console.log(this._v);

    // DASHING
    if (this._input.dashing && !this._dashPressed && this._canDash && !this._grounded) {
      this._canDash = false;
      this._dashPressed = true;

      // sfx and animations
      // this._currentAnim = this._dash;
      // this._dashingSfx.play();
    }

    let dashFactor = 1;
    if (this._dashPressed) {
      if (this.dashTime > Player.DASH_TIME) {
        this.dashTime = 0;
        this._dashPressed = false;
      } else {
        dashFactor = Player.DASH_FACTOR;
      }
      this.dashTime += 1;
    }

    // movements based on camera (from rotation)
    const fwd = this._camRoot.forward;
    const { right } = this._camRoot;
    const correctVertical = fwd.scaleInPlace(this._v);
    const correctHorizontal = right.scaleInPlace(this._h);

    // movement based off of camera's view
    const move = correctHorizontal.addInPlace(correctVertical);

    this._moveDirection = new Vector3(move.normalize().x * dashFactor, 0, move.normalize().z * dashFactor);

    // clamp the input value so that diagonal movement isn't twice as fast
    const inputMag = Math.abs(this._h) + Math.abs(this._v);
    if (inputMag < 0) {
      this._inputAmt = 0;
    } else if (inputMag > 1) {
      this._inputAmt = 1;
    } else {
      this._inputAmt = inputMag;
    }

    // final movement that takes into consideration the inputs
    this._moveDirection = this._moveDirection.scaleInPlace(this._inputAmt * Player.PLAYER_SPEED);

    // check if there is a movement to determine if rotation is needed
    const input = new Vector3(this._input.horizontalAxis, 0, this._input.verticalAxis);
    if (input.length() === 0) {
      console.log('no movement needed');
      return;
    }

    // rotation based on input and the camera angle
    let angle = Math.atan2(this._input.horizontalAxis, this._input.verticalAxis);
    angle += this._camRoot.rotation.y;
    const target = Quaternion.FromEulerAngles(0, angle, 0);
    this.mesh.rotationQuaternion = Quaternion.Slerp(
      this.mesh.rotationQuaternion || Quaternion.Zero(),
      target,
      10 * this._deltaTime,
    );
  }

  public activatePlayerCamera(): UniversalCamera {
    this.scene.registerBeforeRender(() => {
      this._beforeRenderUpdate();
      this._updateCamera();
    });
    return this.camera;
  }

  private _beforeRenderUpdate() {
    this._updateFromControls();
    this._updateGroundDetection();
  }

  // --GROUND DETECTION--
  // Send raycast to the floor to detect if there are any hits with meshes below the character
  private _floorRaycast(offsetx: number, offsetz: number, raycastlen: number): Vector3 {
    const raycastFloorPos = new Vector3(
      this.mesh.position.x + offsetx,
      this.mesh.position.y + 0.5,
      this.mesh.position.z + offsetz,
    );
    const ray = new Ray(raycastFloorPos, Vector3.Up().scale(-1), raycastlen);
    const pick = this.scene.pickWithRay(ray, (mesh) => mesh.isPickable && mesh.isEnabled());
    if (pick !== null && pick.hit && pick.pickedPoint !== null) {
      return pick.pickedPoint;
    }
    return Vector3.Zero();
  }

  // raycast from the center of the player to check for whether player is grounded
  private _isGrounded(): boolean {
    if (this._floorRaycast(0, 0, 0.6).equals(Vector3.Zero())) return false;
    return true;
  }

  private _checkSlope() {
    return [
      [0, 0.25],
      [0, -0.25],
      [0.25, 0],
      [-0.25, 0],
    ].some((rayPos) => {
      const raycast = new Vector3(
        this.mesh.position.x + rayPos[0],
        this.mesh.position.y + 0.5,
        this.mesh.position.z + rayPos[1],
      );
      const ray = new Ray(raycast, Vector3.Up().scale(-1), 1.5);
      const pick = this.scene.pickWithRay(ray, (mesh) => mesh.isPickable && mesh.isEnabled())!;
      if (pick.hit && !pick.getNormal()!.equals(Vector3.Up())) {
        if (pick.pickedMesh!.name.includes('stair')) return true;
      }
      return false;
    });
  }

  private _updateGroundDetection() {
    if (!this._isGrounded()) {
      if (this._checkSlope() && this._gravity.y <= 0) {
        console.log('slope');
        this._gravity.y = 0;
        this._jumpCount = 1;
        this._grounded = true;
      } else {
        this._gravity = this._gravity.addInPlace(Vector3.Up().scale(this._deltaTime * Player.GRAVITY));
        this._grounded = false;
      }
    }
    // limit the speed of gravity to the negative of the jump power
    if (this._gravity.y < -Player.JUMP_FORCE) this._gravity.y = -Player.JUMP_FORCE;

    if (this._input.jumpKeyDown && this._jumpCount > 0) {
      this._gravity.y = Player.JUMP_FORCE;
      this._jumpCount -= 1;
    }

    // update our movement to account for jumping
    this.mesh.moveWithCollisions(this._moveDirection.addInPlace(this._gravity));

    if (this._isGrounded()) {
      this._gravity.y = 0;
      this._grounded = true;
      this._lastGroundPos.copyFrom(this.mesh.position);
      this._jumpCount = 1; // this enables to jump

      // dashing reset
      this._canDash = true;
      this.dashTime = 0;
      this._dashPressed = false;

      // jump & falling animation flags
      this._jumped = false;
      this._isFalling = false;
    }
  }

  private _updateCamera(): void {
    const centerPlayer = this.mesh.position.y + 2;
    this._camRoot.position = Vector3.Lerp(
      this._camRoot.position,
      new Vector3(this.mesh.position.x, centerPlayer, this.mesh.position.z),
      0.4,
    );
  }
}
