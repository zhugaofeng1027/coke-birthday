import Phaser from 'phaser';
import { WORLD, stationsFor, PLAYER_SPEED, interact, stepKitchen, canChop, nearestStation } from './cooking.js';
import { paintKitchen } from './kitchen-art.js';
import { bindCookingControls } from './controls.js';

export function startCooking(host, controlsRoot, kitchen, callbacks) {
  let game;
  let scene;
  let player;
  let stopped = false;
  let paused = false;
  let landscape = false;
  let controls;
  let vector = { x: 0, y: 0 };
  let chopping = false;
  let lastHUD = 0;
  let lastPaint = 0;
  let deliveredNotified = kitchen.delivered;
  const signal = (force = false) => {
    if (stopped) return;
    host.dataset.playerX = kitchen.player.x.toFixed(1); host.dataset.playerY = kitchen.player.y.toFixed(1);
    if (force || performance.now() - lastHUD > 100) {
      lastHUD = performance.now(); callbacks.onUpdate(kitchen);
      host.dataset.nearest = nearestStation(kitchen)?.id || '';
      host.dataset.holding = kitchen.holding?.type === 'ingredient' ? kitchen.holding.id : kitchen.holding?.type || '';
    }
    if (kitchen.delivered && !deliveredNotified) { deliveredNotified = true; callbacks.onDelivered(); }
  };
  const resetInput = () => {
    vector = { x: 0, y: 0 }; chopping = false; controls?.reset();
    player?.body?.setVelocity(0, 0); scene?.input.keyboard?.resetKeys();
  };
  const resizeView = () => {
    if (!scene || stopped) return;
    const height = landscape ? 600 : WORLD.height;
    if (scene.scale.gameSize.height !== height) scene.scale.resize(WORLD.width, height);
    scene.cameras.main.setScroll(0, landscape ? 120 : 0);
    scene.scale.refresh();
  };
  const resizeObserver = new ResizeObserver(resizeView);
  resizeObserver.observe(host);
  const operate = (id) => {
    if (stopped || paused || document.hidden) return;
    interact(kitchen, id);
    if (kitchen.puzzle.openRequested) { kitchen.puzzle.openRequested = false; callbacks.onPuzzle?.(); }
    signal(true);
  };
  controls = bindCookingControls(controlsRoot, {
    move: (x, y) => { vector = { x, y }; },
    chop: active => { chopping = active; },
  });
  class KitchenScene extends Phaser.Scene {
    create() {
      if (stopped) return;
      scene = this;
      const texture = this.textures.createCanvas('kitchen-art', WORLD.width, WORLD.height);
      this.add.image(0, 0, 'kitchen-art').setOrigin(0);
      this.roomTexture = texture;
      this.physics.world.setBounds(24, 246, 792, 451);
      player = this.add.zone(kitchen.player.x, kitchen.player.y, 40, 40);
      this.physics.add.existing(player);
      player.body.setCircle(19, 1, 1).setCollideWorldBounds(true);
      const solids = this.physics.add.staticGroup();
      stationsFor(kitchen).forEach(s => {
        const zone = this.add.zone(s.x + s.w / 2, s.y + s.h / 2, s.w, s.h);
        this.physics.add.existing(zone, true); solids.add(zone);
        zone.setInteractive();
        zone.on('pointerdown', () => operate(s.id));
      });
      this.physics.add.collider(player, solids);
      this.keys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W, down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D,
        arrowUp: Phaser.Input.Keyboard.KeyCodes.UP, arrowDown: Phaser.Input.Keyboard.KeyCodes.DOWN,
        arrowLeft: Phaser.Input.Keyboard.KeyCodes.LEFT, arrowRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        use: Phaser.Input.Keyboard.KeyCodes.E, chop: Phaser.Input.Keyboard.KeyCodes.SPACE,
      }, false);
      const canvas = this.game.canvas; canvas.id = 'kitchen'; canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', '实时生日厨房：移动主厨取食材、切配、煮制、烘烤、装盘和出餐。');
      host.dataset.ready = 'true';
      resizeView();
      signal(true);
    }
    update(time, delta) {
      if (stopped || !player?.body) return;
      const editing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
      const inactive = paused || document.hidden || editing || kitchen.delivered;
      this.input.keyboard.enabled = !inactive;
      let vx = 0; let vy = 0;
      if (!inactive) {
        vx = vector.x + Number(this.keys.right.isDown || this.keys.arrowRight.isDown) - Number(this.keys.left.isDown || this.keys.arrowLeft.isDown);
        vy = vector.y + Number(this.keys.down.isDown || this.keys.arrowDown.isDown) - Number(this.keys.up.isDown || this.keys.arrowUp.isDown);
        const magnitude = Math.hypot(vx, vy);
        if (magnitude > 1) { vx /= magnitude; vy /= magnitude; }
        if (Phaser.Input.Keyboard.JustDown(this.keys.use)) operate();
      }
      const isChopping = !inactive && (chopping || this.keys.chop.isDown) && canChop(kitchen) && Math.hypot(vx, vy) < .1;
      player.body.setVelocity(inactive || isChopping ? 0 : vx * PLAYER_SPEED, inactive || isChopping ? 0 : vy * PLAYER_SPEED);
      kitchen.player.x = player.x; kitchen.player.y = player.y;
      if (!inactive) stepKitchen(kitchen, Math.min(delta / 1000, .06), isChopping);
      if (time - lastPaint >= 30 || lastPaint === 0) {
        lastPaint = time; paintKitchen(this.roomTexture.context, kitchen, time / 1000, !!(vx || vy) && !inactive, isChopping);
        this.roomTexture.refresh();
      }
      signal();
    }
  }
  game = new Phaser.Game({
    type: Phaser.CANVAS, parent: host, width: WORLD.width, height: WORLD.height,
    backgroundColor: '#e5eadf', banner: false, audio: { noAudio: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
    input: { activePointers: 3 }, render: { antialias: true }, scene: KitchenScene,
    callbacks: { postBoot: () => { if (stopped) game?.destroy(true); } },
  });
  const handleBlur = () => resetInput();
  const captureKeys = event => {
    if (!paused && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)
      && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
  };
  window.addEventListener('blur', handleBlur);
  window.addEventListener('keydown', captureKeys);
  document.addEventListener('visibilitychange', handleBlur);
  return {
    interact: operate,
    setLandscape(value) {
      if (landscape === value) return;
      landscape = value; resetInput(); resizeView();
    },
    setPaused(value) {
      paused = value; resetInput();
      if (scene) scene.input.keyboard.enabled = !value;
      signal(true);
    },
    destroy() {
      if (stopped) return;
      stopped = true; resetInput(); controls.destroy();
      resizeObserver.disconnect();
      window.removeEventListener('blur', handleBlur); document.removeEventListener('visibilitychange', handleBlur);
      window.removeEventListener('keydown', captureKeys);
      game.destroy(true);
    },
  };
}
