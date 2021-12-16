import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  ShadowGenerator,
  PointLight,
  Mesh,
  MeshBuilder,
  Color4,
  Color3,
  FreeCamera,
  Matrix,
  Quaternion,
  StandardMaterial,
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
import Environment from './environment';
import Player from './characterController';
import PlayerInput from './inputController';

enum State {
  START = 0,
  GAME = 1,
  LOSE = 2,
  CUTSCENE = 3,
}

class App {
  // General Entire Application
  private _scene: Scene;
  private _canvas: HTMLCanvasElement;
  private _engine: Engine;

  // Game State Related
  public assets: any;
  private _input: PlayerInput;
  private _player: Player;
  private _environment: Environment;

  // Sounds
  // public sfx: Sound;
  // public game: Sound;
  // public end: Sound;

  // Scene - related
  private _state = 0;
  private _gamescene: Scene;
  private _cutScene: Scene;

  // post process
  private _transition = false;

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
    // document.documentElement.style.overflow = 'hidden';
    // document.documentElement.style.overflow = 'hidden';
    // document.documentElement.style.width = '100%';
    // document.documentElement.style.height = '100%';
    // document.documentElement.style.margin = '0';
    // document.documentElement.style.padding = '0';
    // document.body.style.overflow = 'hidden';
    // document.body.style.width = '100%';
    // document.body.style.height = '100%';
    // document.body.style.margin = '0';
    // document.body.style.padding = '0';

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
      this._cutScene,
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

    // Create ENVIRONMENT
    const environment = new Environment(scene);
    this._environment = environment;
    await this._environment.load();

    await this._loadCharacterAssets(scene);
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
      40,
      new Vector3(0, 3, 0),
      scene,
    );
    camera.setTarget(Vector3.Zero());

    const playerUI = AdvancedDynamicTexture.CreateFullscreenUI('UI');
    scene.detachControl();
    const loseButton = Button.CreateSimpleButton('lose', 'LOSE');
    loseButton.width = 0.2;
    loseButton.height = '40px';
    loseButton.color = 'white';
    loseButton.top = '-14px';
    loseButton.thickness = 0;
    loseButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    playerUI.addControl(loseButton);
    loseButton.onPointerDownObservable.add(() => {
      this._goToLose();
      scene.detachControl();
    });

    const light1: HemisphericLight = new HemisphericLight(
      'light1',
      new Vector3(1, 1, 0),
      scene,
    );
    const sphere: Mesh = MeshBuilder.CreateSphere(
      'sphere',
      { diameter: 1 },
      scene,
    );

    await this._initializeGameAsync(scene);

    // Scene FINISHED LOADING
    await scene.whenReadyAsync();
    const outerMesh = scene.getMeshByName('outer');
    if (outerMesh !== null) outerMesh.position = new Vector3(0, 3, 0);

    this._input = new PlayerInput(scene);
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

  // load the character model
  private async _loadCharacterAssets(scene: Scene): Promise<any> {
    async function loadCharacter() {
      // collision mesh
      const outer = MeshBuilder.CreateBox(
        'outer',
        { width: 2, depth: 1, height: 3 },
        scene,
      );
      outer.isVisible = false;
      outer.isPickable = false;
      outer.checkCollisions = true;
      // move origin of box collider to the bottom of the mesh (to match player mesh)
      outer.bakeTransformIntoVertices(Matrix.Translation(0, 1.5, 0));

      // for collisions
      outer.ellipsoid = new Vector3(1, 1.5, 1);
      outer.ellipsoidOffset = new Vector3(0, 1.5, 0);
      // rotate the player mesh 180 since we want to see the back of the player
      outer.rotationQuaternion = new Quaternion(0, 1, 0, 0);

      // --IMPORTING MESH--
      const box = MeshBuilder.CreateBox(
        'Small1',
        {
          width: 0.5,
          depth: 0.5,
          height: 0.25,
          faceColors: [
            new Color4(0, 0, 0, 1),
            new Color4(0, 0, 0, 1),
            new Color4(0, 0, 0, 1),
            new Color4(0, 0, 0, 1),
            new Color4(0, 0, 0, 1),
            new Color4(0, 0, 0, 1),
          ],
        },
        scene,
      );
      box.position.x = 1.5;
      box.position.z = 1;
      const body = Mesh.CreateCylinder('body', 3, 2, 2, 0, 0, scene);
      const bodymtl = new StandardMaterial('red', scene);
      bodymtl.diffuseColor = new Color3(0.8, 0.5, 0.5);
      body.material = bodymtl;
      body.isPickable = false;
      body.bakeTransformIntoVertices(Matrix.Translation(0, 1.5, 0));
      box.parent = body;
      body.parent = outer;

      return {
        mesh: outer as Mesh,
      };
    }

    return loadCharacter().then((assets) => {
      this.assets = assets;
    });
  }

  private async _initializeGameAsync(scene: Scene): Promise<void> {
    // temporary light to light the entire scene
    const light0 = new HemisphericLight(
      'HemiLight',
      new Vector3(0, 1, 0),
      scene,
    );

    const light = new PointLight('sparklight', new Vector3(0, 0, 0), scene);
    light.diffuse = new Color3(
      0.08627450980392157,
      0.10980392156862745,
      0.15294117647058825,
    );
    light.intensity = 35;
    light.radius = 1;

    const shadowGenerator = new ShadowGenerator(1024, light);
    shadowGenerator.darkness = 0.4;

    // Create the player
    // this._player = new Player(this.assets, scene, shadowGenerator); // dont have inputs yet so we dont need to pass it in
    this._player = new Player(this.assets, scene, shadowGenerator, this._input);
  }
}

new App();
