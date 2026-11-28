export function contains({ x, y, w, h }, point) {
  return point.x >= x && point.y >= y && point.x <= x + w && point.y <= y + h;
}

export function layoutFor(width, height, menu, safe) {
  const s = Math.min(1.15, height / 390, width / 680);
  // Use symmetric insets to leave room for the notch in either landscape direction.
  const sameOrientation = safe && safe.right <= width + 1 && safe.bottom <= height + 1;
  const portraitOrientation = safe && width > height && safe.right <= height + 1 && safe.bottom <= width + 1;
  const margin = sameOrientation ? Math.max(10, safe.left + 5, width - safe.right + 5)
    : portraitOrientation ? Math.max(18, safe.top + 5, width - safe.bottom + 5) : 18;
  const bottom = sameOrientation ? Math.max(9, height - safe.bottom + 5)
    : portraitOrientation ? Math.max(10, safe.left + 5, height - safe.right + 5) : 10;
  const header = Math.max(Math.round(44 * s), (menu?.bottom || 0) + 4);
  const headerRight = menu?.left > width * .55 ? Math.min(menu.left - 7, width - margin) : width - margin;
  const orders = Math.round(58 * s);
  const stage = { x: 0, y: header + orders, w: width, h: Math.max(1, height - header - orders) };
  const stick = Math.round(116 * s);
  const hand = Math.round(86 * s);
  const scissors = Math.round(61 * s);
  return {
    width, height, s, margin, bottom, header, headerRight, orders, stage,
    joystick: { x: margin + stick / 2, y: height - stick / 2 - bottom, r: stick / 2 },
    use: { x: width - margin - hand, y: height - bottom - hand, w: hand, h: hand },
    cut: { x: width - margin - hand - scissors - 10 * s, y: height - bottom - (hand + scissors) / 2, w: scissors, h: scissors },
  };
}

export function touchPoint(touch) {
  return { id: touch.identifier, x: touch.clientX ?? touch.x, y: touch.clientY ?? touch.y };
}
