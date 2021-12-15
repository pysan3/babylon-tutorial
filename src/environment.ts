import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import { Scene, Vector3, Mesh } from '@babylonjs/core';

export default class Environment {
  private _scene: Scene;

  constructor(scene: Scene) {
    this._scene = scene;
  }

  public async load() {
    const ground = Mesh.CreateBox('ground', 24, this._scene);
    ground.scaling = new Vector3(1, 0.02, 1);
  }
}
