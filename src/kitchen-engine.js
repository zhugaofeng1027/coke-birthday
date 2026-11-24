import Phaser from 'phaser';
import { WORLD, worldFor, setKitchenLayout, stationsFor, PLAYER_SPEED, interact, stepKitchen, canChop, nearestStation } from './cooking.js';
import { paintKitchen } from './kitchen-art.js';
import { bindCookingControls } from './controls.js';
import { CHOP_BEAT } from './kitchen-sounds.js';

export function startCooking(host, controlsRoot, kitchen, callbacks, polish = false) {
  let game;
  let scene;
  let player;
  let stopped = false;
  let paused = false;
  let workingModal = false;
  let landscape = kitchen.layout === 'landscape';
  let controls;
  let vector = { x: 0, y: 0 };
  let chopping = false;
  let solids;
  let room;
  let lastHUD = 0;
  let lastPaint = 0;
  const motion = polish ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  let facing = 1;
  let gait = 0;
  let action = null;
  let serving = null;
  let expiredNotified = kitchen.expired;
  let ordersNotified = kitchen.deliveries;
  let missedNotified = kitchen.missedOrders;
  const signal = (force = false) => {
    if (stopped) return;
    host.dataset.playerX = kitchen.player.x.toFixed(1); host.dataset.playerY = kitchen.player.y.toFixed(1);
    const served = kitchen.deliveries !== ordersNotified ? kitchen.lastServedOrder : null;
    const missed = kitchen.missedOrders !== missedNotified ? kitchen.lastMissedOrderIds : null;
    ordersNotified = kitchen.deliveries;
    missedNotified = kitchen.missedOrders;
    if (polish && served) {
      serving = { stationId: served.stationId, time: performance.now() };
      callbacks.onKitchenCue?.('serve');
    }
    if (force || served || missed || performance.now() - lastHUD > 100) {
      lastHUD = performance.now(); callbacks.onUpdate(kitchen, served || missed ? { served, missed } : null);
      host.dataset.nearest = nearestStation(kitchen)?.id || '';
      host.dataset.holding = kitchen.holding?.type === 'ingredient' ? kitchen.holding.id : kitchen.holding?.type || '';
    }
    if (kitchen.expired && !expiredNotified) { expiredNotified = true; callbacks.onExpired?.(); }
  };
  const resetInput = () => {
    vector = { x: 0, y: 0 }; chopping = false; controls?.reset();
    player?.body?.setVelocity(0, 0); scene?.input.keyboard?.resetKeys();
  };
  const resizeView = () => {
    if (!scene || stopped) return;
    const world = worldFor(kitchen);
    const ratio = host.clientWidth / Math.max(1, host.clientHeight);
    const width = landscape ? Math.ceil(Math.max(world.width, world.height * ratio)) : world.width;
    const height = landscape ? Math.ceil(Math.max(world.height, world.width / ratio)) : world.height;
    if (scene.scale.gameSize.width !== width || scene.scale.gameSize.height !== height) {
      scene.scale.setGameSize(width, height);
      scene.roomTexture.setSize(width, height);
      room.setTexture('kitchen-art').setPosition(-(width - world.width) / 2, -(height - world.height) / 2);
    }
    scene.cameras.main.setScroll(-(width - world.width) / 2, -(height - world.height) / 2);
    host.dataset.layout = landscape ? 'landscape' : 'desktop';
    scene.scale.refresh();
    lastPaint = 0;
  };
  const resizeObserver = new ResizeObserver(resizeView);
  resizeObserver.observe(host);
  const operate = (id) => {
    if (stopped || paused || document.hidden) return;
    const deliveries = kitchen.deliveries;
    const target = polish ? id ? stationsFor(kitchen).find(s => s.id === id) : nearestStation(kitchen) : null;
    const held = kitchen.holding;
    const portions = held?.contents?.length;
    const jobItem = kitchen[target?.id]?.item;
    interact(kitchen, id);
    if (target && kitchen.deliveries === deliveries && !kitchen.packing.openRequested
      && (held !== kitchen.holding || portions !== kitchen.holding?.contents?.length
          || jobItem !== kitchen[target.id]?.item)) {
      const kind = target.type === 'oven' ? 'oven' : !held && kitchen.holding ? 'take' : 'place';
      action = { stationId: target.id, time: performance.now() };
      callbacks.onKitchenCue?.(kind);
    }
    if (kitchen.puzzle.openRequested) { kitchen.puzzle.openRequested = false; callbacks.onPuzzle?.(); }
    if (kitchen.photo.openRequested) { kitchen.photo.openRequested = false; callbacks.onPhoto?.(); }
    if (kitchen.packing.openRequested) { kitchen.packing.openRequested = false; callbacks.onPacking?.(); }
    signal(true);
  };
  controls = bindCookingControls(controlsRoot, {
    move: (x, y) => { vector = { x, y }; },
    chop: active => { chopping = active; },
  });
  const rebuildStations = () => {
    solids.clear(true, true);
    const world = worldFor(kitchen);
    scene.physics.world.setBounds(24, landscape ? 24 : 246, world.width - 48, world.height - (landscape ? 48 : 269));
    player.setPosition(kitchen.player.x, kitchen.player.y);
    player.body.reset(kitchen.player.x, kitchen.player.y);
    stationsFor(kitchen).forEach(s => {
      const zone = scene.add.zone(s.x + s.w / 2, s.y + s.h / 2, s.w, s.h);
      scene.physics.add.existing(zone, true); solids.add(zone);
      zone.setInteractive();
      zone.on('pointerdown', () => operate(s.id));
    });
  };
  class KitchenScene extends Phaser.Scene {
    create() {
      if (stopped) return;
      scene = this;
      const texture = this.textures.createCanvas('kitchen-art', WORLD.width, WORLD.height);
      room = this.add.image(0, 0, 'kitchen-art').setOrigin(0);
      this.roomTexture = texture;
      player = this.add.zone(kitchen.player.x, kitchen.player.y, 40, 40);
      this.physics.add.existing(player);
      player.body.setCircle(19, 1, 1).setCollideWorldBounds(true);
      solids = this.physics.add.staticGroup();
      rebuildStations();
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
      const inactive = paused || document.hidden || editing || kitchen.delivered || kitchen.expired;
      const queueFocused = !!document.activeElement?.closest('.order-queue');
      this.input.keyboard.enabled = !inactive && !queueFocused;
      let vx = 0; let vy = 0;
      if (!inactive) {
        vx = vector.x + (queueFocused ? 0 : Number(this.keys.right.isDown || this.keys.arrowRight.isDown) - Number(this.keys.left.isDown || this.keys.arrowLeft.isDown));
        vy = vector.y + (queueFocused ? 0 : Number(this.keys.down.isDown || this.keys.arrowDown.isDown) - Number(this.keys.up.isDown || this.keys.arrowUp.isDown));
        const magnitude = Math.hypot(vx, vy);
        if (magnitude > 1) { vx /= magnitude; vy /= magnitude; }
        if (!queueFocused && Phaser.Input.Keyboard.JustDown(this.keys.use)) operate();
      }
      const isChopping = !inactive && (chopping || (!queueFocused && this.keys.chop.isDown)) && canChop(kitchen) && Math.hypot(vx, vy) < .1;
      const dx = player.x - kitchen.player.x;
      const distance = Math.hypot(dx, player.y - kitchen.player.y);
      const walking = distance > .15 && !inactive;
      if (polish && isChopping) {
        const board = nearestStation(kitchen);
        if (board) facing = board.x + board.w / 2 < player.x ? -1 : 1;
      } else if (walking && Math.abs(dx) > .15) facing = Math.sign(dx);
      if (walking) gait += distance / 11;
      player.body.setVelocity(inactive || isChopping ? 0 : vx * PLAYER_SPEED, inactive || isChopping ? 0 : vy * PLAYER_SPEED);
      kitchen.player.x = player.x; kitchen.player.y = player.y;
      const progress = kitchen.board.progress;
      if (!document.hidden && (!paused || workingModal)) stepKitchen(kitchen, delta / 1000, isChopping);
      if (polish && isChopping && Math.floor(kitchen.board.progress / CHOP_BEAT) > Math.floor(progress / CHOP_BEAT)) {
        callbacks.onKitchenCue?.('chop');
      }
      if (time - lastPaint >= 30 || lastPaint === 0) {
        lastPaint = time;
        const now = performance.now();
        const age = action ? (now - action.time) / 1000 : Infinity;
        const servingAge = serving ? (now - serving.time) / 1000 : Infinity;
        paintKitchen(this.roomTexture.context, kitchen, time / 1000, polish ? walking : !!(vx || vy) && !inactive, isChopping,
          polish ? { facing, gait, reduced: motion.matches,
            serving: servingAge < .68 ? { stationId: serving.stationId, age: servingAge } : null,
            action: age < .52 ? { ...action, age } : null } : null);
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
    if (!paused && !document.activeElement?.closest('.order-queue') && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)
      && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
  };
  window.addEventListener('blur', handleBlur);
  window.addEventListener('keydown', captureKeys);
  document.addEventListener('visibilitychange', handleBlur);
  return {
    interact: operate,
    setLandscape(value) {
      if (landscape === value) return;
      landscape = value; resetInput();
      setKitchenLayout(kitchen, value);
      if (scene) {
        rebuildStations();
        resizeView();
        signal(true);
      }
    },
    setPaused(value, keepWorking = false) {
      paused = value; workingModal = keepWorking; resetInput();
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
