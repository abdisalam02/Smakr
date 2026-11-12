/** Shared timing for focusing a venue on the map (camera + dock animation). */
export const SELECTION_TARGET_ZOOM = 15.4;
export const SELECTION_CARD_HEIGHT = 255;
export const SELECTION_CARD_BOTTOM_INSET = 36;

/** Screen distance (px) from the current projection to the focused spot. */
export function selectionPanDistance(
  map: { project: (lngLat: [number, number]) => { x: number; y: number }; getContainer: () => HTMLElement },
  lng: number,
  lat: number,
  mobile: boolean
) {
  const container = map.getContainer();
  const w = container.clientWidth || 390;
  const h = container.clientHeight || 844;
  const pin = map.project([lng, lat]);
  const cardTop = h - (SELECTION_CARD_HEIGHT + SELECTION_CARD_BOTTOM_INSET);
  const targetX = w / 2;
  const targetY = mobile ? cardTop + 4 : h / 2;
  return Math.hypot(pin.x - targetX, pin.y - targetY);
}

/** Duration used by both MapLibre's flight and the dock card/carousel motion. */
export function selectionFlightDuration(panDistance: number, zoomDelta: number) {
  return Math.round(
    Math.max(560, Math.min(1200, 560 + panDistance * 0.55 + zoomDelta * 140))
  );
}
