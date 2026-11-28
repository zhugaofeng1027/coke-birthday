export const DEBUG_SCENES = {
  opening: { param: 'intro', chapter: 0, label: '开场动画' },
  flower: { param: 'flower-room', chapter: 5, label: '隐藏礼物 · DIMOO 永生花' },
  candles: { param: 'candle', chapter: 5, label: '吹蜡烛 · 生日蛋糕' },
};

export const TOUCH_DEMO_PARAM = 'touch-demo';

export function readDebugScene(params) {
  return ['candles', 'flower', 'opening'].find(scene => params.get(DEBUG_SCENES[scene].param) === '1') ?? null;
}

export function isTouchControlsDemo(params) {
  return import.meta.env.DEV && params.get(TOUCH_DEMO_PARAM) === '1'
    && params.get('debug') === '1' && params.get('chapter') === '1' && !readDebugScene(params);
}

export function setDebugParams(params, { debug, chapter, scene }) {
  const wasDebug = params.has('debug');
  for (const key of ['debug', 'chapter', 'flower-room', 'candle']) params.delete(key);
  if (debug || wasDebug) params.delete('intro');
  if (debug) {
    params.set('debug', '1');
    params.set('chapter', String(chapter + 1));
    if (scene) params.set(DEBUG_SCENES[scene].param, '1');
  }
  if (!debug || chapter !== 1 || scene) params.delete('kitchen-polish');
  if (!debug || chapter !== 0 || scene || !import.meta.env.DEV) params.delete(TOUCH_DEMO_PARAM);
}
