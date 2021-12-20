import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import { Scene, Vector3, Mesh, SceneLoader } from '@babylonjs/core';

export default class Environment {
  private _scene: Scene;

  constructor(scene: Scene) {
    this._scene = scene;
  }

  public async load() {
    const ground = Mesh.CreateBox('ground', 24, this._scene);
    ground.scaling = new Vector3(1, 0.02, 1);
    const assets = await this._loadAsset();
    assets.allMeshes.forEach((m) => {
      m.receiveShadows = true;
      m.checkCollisions = true;
    });
  }

  private async _loadAsset() {
    const result = await SceneLoader.ImportMeshAsync(null, './models/', 'envSetting.glb', this._scene);
    const env = result.meshes[0];
    const allMeshes = env.getChildMeshes();

    return { env, allMeshes };
  }
}
