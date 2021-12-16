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

  private static readonly DOWN_TILT: Vector3 = new Vector3(
    0.8290313946973066,
    0,
    0,
  );

  private static readonly ORIGINAL_TILT: Vector3 = new Vector3(
    0.5934119456780721,
    0,
    0,
  );

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

  constructor(
    assets: any,
    scene: Scene,
    shadowGenerator: ShadowGenerator,
    input?: any,
  ) {
    super('player', scene);
    this.scene = scene;
    this._setupPlayerCamera();

    this.mesh = assets.mesh;
    this.mesh.parent = this;

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
    this.camera = new UniversalCamera(
      'cam',
      new Vector3(0, 0, -30),
      this.scene,
    );
    this.camera.lockedTarget = this._camRoot.position;
    this.camera.fov = 0.47350045992678597;
    this.camera.parent = yTilt;

    this.scene.activeCamera = this.camera;
    return this.camera;
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
