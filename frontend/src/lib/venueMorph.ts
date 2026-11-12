/**
 * Hand-off state for the spotlight-card → venue-sheet morph.
 *
 * The card's "Details" action opens the sheet in place (no slide) and then a
 * lightweight fixed overlay flies the card photo into the sheet hero, so we
 * never cross-fade the whole page (which let the map show through the sheet).
 */
export type MorphRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

let instantSheetEntry = false;
let morphImageUrl: string | null = null;
let morphSourceRect: MorphRect | null = null;

export function beginInstantVenueSheet(
  imageUrl?: string | null,
  rect?: MorphRect | null
) {
  instantSheetEntry = true;
  morphImageUrl = imageUrl || null;
  morphSourceRect = rect || null;
}

export function endInstantVenueSheet() {
  instantSheetEntry = false;
  morphImageUrl = null;
  morphSourceRect = null;
}

export function isInstantVenueSheet() {
  return instantSheetEntry;
}

export function getVenueMorphImage() {
  return morphImageUrl;
}

export function getVenueMorphRect() {
  return morphSourceRect;
}

/**
 * Fly a fixed copy of the card photo into the sheet hero. The sheet itself is
 * already opaque underneath, so the map can never show through during the
 * hand-off. Removes the overlay and restores the hero when done.
 */
export function playVenueMorphOverlay(source: MorphRect, imageUrl: string) {
  if (typeof document === "undefined") {
    endInstantVenueSheet();
    return;
  }
  const target = document.querySelector<HTMLElement>("[data-venue-hero-target]");
  if (!target) {
    endInstantVenueSheet();
    return;
  }
  const tr = target.getBoundingClientRect();
  if (!tr.width || !tr.height) {
    endInstantVenueSheet();
    return;
  }

  // The overlay mirrors the composition the sheet will land in: the hero photo
  // plus the beige body card tucked over its lower edge, so both move as one.
  const bodyOverlap = 65;
  const beigeHeight = 110;
  const containerHeight = tr.height - bodyOverlap + beigeHeight;

  const overlay = document.createElement("div");
  overlay.style.cssText = [
    "position:fixed",
    `left:${tr.left}px`,
    `top:${tr.top}px`,
    `width:${tr.width}px`,
    `height:${containerHeight}px`,
    "overflow:hidden",
    "border-radius:24px",
    "z-index:70",
    "pointer-events:none",
    "transform-origin:top left",
    "will-change:transform",
    "background:#181615",
  ].join(";");

  const img = document.createElement("img");
  img.src = imageUrl;
  img.alt = "";
  img.style.cssText = [
    "display:block",
    "position:absolute",
    "left:0",
    "top:0",
    `width:${tr.width}px`,
    `height:${tr.height}px`,
    "object-fit:cover",
    "object-position:center",
  ].join(";");
  overlay.appendChild(img);

  // Match the sheet hero's gradient so the image doesn't change tone on landing.
  const gradient = document.createElement("div");
  gradient.style.cssText = [
    "position:absolute",
    "inset:0",
    "pointer-events:none",
    "background:linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.9) 100%)",
  ].join(";");
  overlay.appendChild(gradient);

  // The beige body card rises from the bottom of the image while they travel.
  const sheetSurface = document.querySelector<HTMLElement>(".smakr-bottom-sheet");
  const beigeColor = sheetSurface
    ? getComputedStyle(sheetSurface).backgroundColor
    : "#FAF7F2";
  const beige = document.createElement("div");
  beige.style.cssText = [
    "position:absolute",
    "left:0",
    "right:0",
    `top:${tr.height - bodyOverlap}px`,
    `height:${beigeHeight}px`,
    `background:${beigeColor}`,
    "border-radius:24px 24px 0 0",
    "box-shadow:0 -8px 24px rgba(24,22,21,0.11)",
    "will-change:transform",
  ].join(";");
  overlay.appendChild(beige);

  // Hide the sheet's final hero until the flying card lands on it.
  const previousOpacity = target.style.opacity;
  target.style.opacity = "0";
  document.body.appendChild(overlay);

  const sx = source.left - tr.left;
  const sy = source.top - tr.top;
  const sw = source.width / tr.width;
  const sh = source.height / containerHeight;

  let cleanedUp = false;
  const revealHero = () => {
    target.style.opacity = previousOpacity;
  };
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    revealHero();
    overlay.remove();
    endInstantVenueSheet();
  };

  const cardAnim = overlay.animate(
    [
      {
        transform: `translate(${sx}px, ${sy}px) scale(${sw}, ${sh})`,
        borderRadius: "26px",
      },
      {
        transform: "translate(0px, 0px) scale(1, 1)",
        borderRadius: "24px",
      },
    ],
    { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" }
  );
  cardAnim.addEventListener("finish", revealHero);

  beige.animate(
    [
      { transform: `translateY(${beigeHeight}px)` },
      { transform: "translateY(0px)" },
    ],
    { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" }
  );

  // Keep the landed card while the sheet fades in underneath, then hand off.
  window.setTimeout(cleanup, 480);
}
