import { Scene, ActionManager, ExecuteCodeAction, Observer, Scalar } from '@babylonjs/core';

export default class PlayerInput {
  public inputMap: any;
  private _scene: Scene;

  // simple movement
  public horizontal = 0;
  public vertical = 0;
  // tracks whether or not there is movement in that axis
  public horizontalAxis = 0;
  public verticalAxis = 0;

  // jumping and dashing
  public jumpKeyDown = false;
  public dashing = false;

  // Mobile Input trackers
  public mobileLeft: boolean;
  public mobileRight: boolean;
  public mobileUp: boolean;
  public mobileDown: boolean;
  private _mobileJump: boolean;
  private _mobileDash: boolean;

  constructor(scene: Scene) {
    scene.actionManager = new ActionManager(scene);
    this.inputMap = {};
    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
        this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type === 'keydown';
      }),
    );
    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
        this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type === 'keydown';
      }),
    );

    scene.onBeforeRenderObservable.add(() => {
      this._updateFromKeyboard();
    });
  }

  private _updateFromKeyboard(): void {
    if (this.inputMap.ArrowUp) {
      this.vertical = Scalar.Lerp(this.vertical, 1, 0.2);
      this.verticalAxis = 1;
    } else if (this.inputMap.ArrowDown) {
      this.vertical = Scalar.Lerp(this.vertical, -1, 0.2);
      this.verticalAxis = -1;
    } else {
      this.vertical = 0;
      this.verticalAxis = 0;
    }

    if (this.inputMap.ArrowLeft) {
      this.horizontal = Scalar.Lerp(this.horizontal, -1, 0.2);
      this.horizontalAxis = -1;
    } else if (this.inputMap.ArrowRight) {
      this.horizontal = Scalar.Lerp(this.horizontal, 1, 0.2);
      this.horizontalAxis = 1;
    } else {
      this.horizontal = 0;
      this.horizontalAxis = 0;
    }

    this.dashing = !!this.inputMap.Shift;
    this.jumpKeyDown = !!this.inputMap[' '];
  }
}
