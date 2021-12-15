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
    const camera4 = new ArcRotateCamera(
      'arc',
      -Math.PI / 2,
      Math.PI / 2,
      40,
      new Vector3(0, 3, 0),
      this.scene,
    );
  }
}
