/** Shared timing for focusing a venue on the map (camera + dock animation). */
export const SELECTION_TARGET_ZOOM = 15.4;
export const SELECTION_CARD_HEIGHT = 246;
// Matches HomeView dock offset (76px above bottom nav) + stage bottom-2 (8px).
export const SELECTION_CARD_BOTTOM_INSET = 84;
// Clear vertical gap (px) between the top edge of the spotlight card + pointer
// arrow and the selected food pin center above it.
export const SELECTION_PIN_GAP = 54;

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
  const targetY = mobile ? cardTop - SELECTION_PIN_GAP : h / 2;
  return Math.hypot(pin.x - targetX, pin.y - targetY);
}

/**
 * Distance- and zoom-aware flight duration used by MapLibre and dock sync:
 * short zoomed-in pans feel crisp (~360–520ms), while zoomed-out or
 * cross-city jumps take longer (~650–960ms) so vector tiles stream smoothly.
 */
export function selectionFlightDuration(panDistance: number, zoomDelta: number) {
  return Math.round(
    Math.max(360, Math.min(960, 340 + panDistance * 0.36 + zoomDelta * 145))
  );
}
