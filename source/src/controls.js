export function bindCookingControls(root, handlers) {
  const abort = new AbortController();
  const options = { signal: abort.signal };
  const stick = root.querySelector('.joystick');
  const knob = root.querySelector('.joystick-knob');
  const chop = root.querySelector('[data-action="kitchen-chop"]');
  let pointer = null;
  let chopPointer = null;
  const stopMove = () => { pointer = null; handlers.move(0, 0); knob.style.transform = 'translate(0px, 0px)'; stick.classList.remove('moving'); };
  const stopChop = () => { chopPointer = null; handlers.chop(false); chop.classList.remove('pressed'); };
  function setPosition(event) {
    const rect = stick.getBoundingClientRect();
    let x = event.clientX - rect.left - rect.width / 2;
    let y = event.clientY - rect.top - rect.height / 2;
    const distance = Math.hypot(x, y); const radius = rect.width * .3;
    if (distance > radius) { x *= radius / distance; y *= radius / distance; }
    const strength = Math.min(1, distance / radius);
    if (distance < 5) handlers.move(0, 0);
    else handlers.move(x / Math.hypot(x, y) * strength, y / Math.hypot(x, y) * strength);
    knob.style.transform = `translate(${x}px, ${y}px)`;
  }
  stick.addEventListener('pointerdown', event => {
    if (pointer !== null) return;
    event.preventDefault(); pointer = event.pointerId; stick.setPointerCapture(pointer); stick.classList.add('moving');
    setPosition(event);
  }, options);
  stick.addEventListener('pointermove', event => { if (event.pointerId === pointer) { event.preventDefault(); setPosition(event); } }, options);
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) stick.addEventListener(name, event => { if (event.pointerId === pointer) stopMove(); }, options);
  chop.addEventListener('pointerdown', event => {
    if (chop.disabled) return;
    event.preventDefault(); chopPointer = event.pointerId; chop.setPointerCapture(chopPointer); handlers.chop(true); chop.classList.add('pressed');
  }, options);
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) chop.addEventListener(name, event => { if (event.pointerId === chopPointer) stopChop(); }, options);
  chop.addEventListener('keydown', event => {
    if ([' ', 'Enter'].includes(event.key) && !chop.disabled) { event.preventDefault(); handlers.chop(true); chop.classList.add('pressed'); }
  }, options);
  chop.addEventListener('keyup', event => { if ([' ', 'Enter'].includes(event.key)) stopChop(); }, options);
  root.querySelectorAll('[data-move]').forEach(button => {
    button.addEventListener('keydown', event => {
      if (![' ', 'Enter'].includes(event.key)) return;
      event.preventDefault();
      const [x, y] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[button.dataset.move];
      handlers.move(x, y);
    }, options);
    button.addEventListener('keyup', event => { if ([' ', 'Enter'].includes(event.key)) stopMove(); }, options);
  });
  const reset = () => { stopMove(); stopChop(); };
  window.addEventListener('blur', reset, options);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); }, options);
  return { reset, destroy() { reset(); abort.abort(); } };
}
