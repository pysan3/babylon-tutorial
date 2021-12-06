import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  Color4,
  FreeCamera,
} from '@babylonjs/core';
import {
  AdvancedDynamicTexture,
  StackPanel,
  Button,
  TextBlock,
  Rectangle,
  Control,
  Image,
} from '@babylonjs/gui';

enum State {
  START = 0,
  GAME = 1,
  LOSE = 2,
  CUTSCENE = 3,
}

class App {
  private _scene: Scene;

  private _canvas: HTMLCanvasElement;

  private _engine: Engine;

  private _state = 0;

  private _cutScene: Scene;

  private _gameScene: Scene;

  constructor() {
    // create the canvas html element and attach it to the webpage
    this._canvas = this._createCanvas();

    // initialize babylon scene and engine
    this._engine = new Engine(this._canvas, true);
    this._scene = new Scene(this._engine);

    // hide/show the Inspector
    window.addEventListener('keydown', (ev) => {
      // Shift+Ctrl+Alt+I
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
        if (this._scene.debugLayer.isVisible()) {
          this._scene.debugLayer.hide();
        } else {
          this._scene.debugLayer.show();
        }
      }
    });

    // run the main render loop
    this._main();
  }

  private _createCanvas(): HTMLCanvasElement {
    // Commented out for development
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.width = '100%';
    document.documentElement.style.height = '100%';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    // create the canvas html element and attach it to the webpage
    this._canvas = document.createElement('canvas');
    this._canvas.style.width = '100%';
    this._canvas.style.height = '100%';
    this._canvas.id = 'gameCanvas';
    document.body.appendChild(this._canvas);

    return this._canvas;
  }

  // goToStart
  private async _goToStart() {
    this._engine.displayLoadingUI();

    // SCENE SETUP
    this._scene.detachControl();
    const scene = new Scene(this._engine);
    scene.clearColor = new Color4(0, 0, 0, 1);
    const camera = new FreeCamera('Camera1', new Vector3(0, 0, 0), scene);
    camera.setTarget(Vector3.Zero());

    // GUI for LOADING SCREEN
    const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI('UI');
    guiMenu.idealHeight = 720;

    const startButton = Button.CreateSimpleButton('start', 'PLAY');
    startButton.width = 0.2;
    startButton.height = '40px';
    startButton.color = 'white';
    startButton.top = '-14px';
    startButton.thickness = 0;
    startButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    guiMenu.addControl(startButton);

    startButton.onPointerDownObservable.add(() => {
      this._goToCutScene();
      scene.detachControl();
    });

    // SCENE FINISH LOADING
    await scene.whenReadyAsync();
    this._engine.hideLoadingUI();
    this._scene.dispose();
    this._scene = scene;
    this._state = State.START;
  }

  private async _goToLose(): Promise<void> {
    this._engine.displayLoadingUI();

    // SCENE SETUP
    this._scene.detachControl();
    const scene = new Scene(this._engine);
    scene.clearColor = new Color4(0, 0, 0, 1);
    const camera = new FreeCamera('camera1', new Vector3(0, 0, 0), scene);
    camera.setTarget(Vector3.Zero());

    // GUI
    const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI('UI');
    const mainButton = Button.CreateSimpleButton('mainmenu', 'MAIN MENU');
    mainButton.width = 0.2;
    mainButton.height = '40px';
    mainButton.color = 'white';
    guiMenu.addControl(mainButton);
    mainButton.onPointerUpObservable.add(() => {
      this._goToStart();
    });

    // SCREEN FINISHED LOADING
    await scene.whenReadyAsync();
    this._engine.hideLoadingUI();
    this._scene.dispose();
    this._scene = scene;
    this._state = State.LOSE;
  }

  private async _goToCutScene(): Promise<void> {
    this._engine.displayLoadingUI();

    // SCENE SETUP
    this._scene.detachControl();
    this._cutScene = new Scene(this._engine);
    this._cutScene.clearColor = new Color4(0, 0, 0, 1);
    const camera = new FreeCamera(
      'camera1',
      new Vector3(0, 0, 0),
      this._cutScene
    );
    camera.setTarget(Vector3.Zero());

    // GUI
    const cutScene = AdvancedDynamicTexture.CreateFullscreenUI('UI');
    const nextButton = Button.CreateSimpleButton('nextmenu', 'NEXT');
    nextButton.thickness = 0;
    nextButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    nextButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    nextButton.width = '64px';
    nextButton.height = '64px';
    nextButton.color = 'white';
    nextButton.top = '-3%';
    nextButton.left = '-12%';
    nextButton.isVisible = true;
    cutScene.addControl(nextButton);
    nextButton.onPointerUpObservable.add(() => {
      this._goToGame();
    });

    // SCREEN FINISHED LOADING
    await this._cutScene.whenReadyAsync();
    this._engine.hideLoadingUI();
    this._scene.dispose();
    this._scene = this._cutScene;
    this._state = State.CUTSCENE;

    let finishedLoading = false;
    await this._setUpGame().then(() => {
      finishedLoading = true;
    });
  }

  private async _setUpGame() {
    const scene = new Scene(this._engine);
    this._gameScene = scene;
  }

  private async _goToGame() {
    // SETUP
    this._scene.detachControl();
    const scene = this._gameScene;
    scene.clearColor = new Color4(
      0.01568627450980392,
      0.01568627450980392,
      0.20392156862745098,
    );
    const camera: ArcRotateCamera = new ArcRotateCamera(
      'Camera',
      Math.PI / 2,
      Math.PI / 2,
      2,
      Vector3.Zero(),
      scene
    );
    camera.setTarget(Vector3.Zero());

    const playerUI = AdvancedDynamicTexture.CreateFullscreenUI('UI');
    scene.detachControl();
    const loseButton = Button.CreateSimpleButton('losemenu', 'lose');
    loseButton.thickness = 0;
    loseButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    loseButton.width = 0.2;
    loseButton.height = '40ox';
    loseButton.color = 'white';
    loseButton.top = '-14px';
    playerUI.addControl(loseButton);
    loseButton.onPointerUpObservable.add(() => {
      this._goToLose();
      scene.detachControl();
    });

    const light1: HemisphericLight = new HemisphericLight(
      'light1',
      new Vector3(1, 1, 0),
      this._scene
    );
    const sphere: Mesh = MeshBuilder.CreateSphere(
      'sphere',
      { diameter: 1 },
      this._scene
    );

    this._scene.dispose();
    this._state = State.GAME;
    this._scene = scene;
    this._engine.hideLoadingUI();
    this._scene.attachControl();
  }

  private async _main(): Promise<void> {
    await this._goToStart();

    this._engine.runRenderLoop(() => {
      switch (this._state) {
        case State.START:
          this._scene.render();
          break;
        case State.CUTSCENE:
          this._scene.render();
          break;
        case State.GAME:
          this._scene.render();
          break;
        case State.LOSE:
          this._scene.render();
          break;
        default:
          break;
      }
    });

    window.addEventListener('resize', () => {
      this._engine.resize();
    });
  }
}

new App();
