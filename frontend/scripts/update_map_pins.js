const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/components/map/MapRadarView.tsx');
let file = fs.readFileSync(targetPath, 'utf8');
const isCrlf = file.includes('\r\n');
file = file.replace(/\r\n/g, '\n');

// 1. Update applyPinState: zIndex for Weekly Pick (44) & Selected (55), sizes (39/44, 43/48), and keep #smakr-diecut-default when selected
const oldApplyStart = `function applyPinState(root: HTMLElement, isSelected: boolean) {
  root.dataset.selected = isSelected ? "1" : "0";
  root.style.zIndex = isSelected ? "35" : "15";
  const visual = root.querySelector<HTMLElement>(".pin-visual");
  if (visual) visual.style.transform = isSelected ? "scale(1.14)" : "scale(1.0)";
  const puck = root.querySelector<HTMLElement>(".smakr-map-puck");
  const iconContainer = root.querySelector<HTMLElement>(".smakr-puck-icon");
  const dot = root.querySelector<HTMLElement>(".smakr-puck-dot");
  const isPopup = root.dataset.isPopup === "1";
  const isWeeklyPick = root.dataset.isWeeklyPick === "1";
  const baseIconPx = isWeeklyPick ? 42 : 37;
  const selectedIconPx = isWeeklyPick ? 46 : 41;`;

const newApplyStart = `function applyPinState(root: HTMLElement, isSelected: boolean) {
  const isPopup = root.dataset.isPopup === "1";
  const isWeeklyPick = root.dataset.isWeeklyPick === "1";
  root.dataset.selected = isSelected ? "1" : "0";
  root.style.zIndex = isSelected ? "55" : isWeeklyPick ? "44" : "15";
  const visual = root.querySelector<HTMLElement>(".pin-visual");
  if (visual) visual.style.transform = isSelected ? "scale(1.14)" : "scale(1.0)";
  const puck = root.querySelector<HTMLElement>(".smakr-map-puck");
  const iconContainer = root.querySelector<HTMLElement>(".smakr-puck-icon");
  const dot = root.querySelector<HTMLElement>(".smakr-puck-dot");
  const baseIconPx = isWeeklyPick ? 44 : 39;
  const selectedIconPx = isWeeklyPick ? 48 : 43;`;

if (!file.includes(oldApplyStart)) {
  throw new Error('oldApplyStart not found');
}
file = file.replace(oldApplyStart, newApplyStart);

// 2. Remove orange stroke filter on selected icon (only the dot turns orange)
file = file.replace(
  'iconContainer.style.filter = "url(#smakr-diecut-selected)";',
  'iconContainer.style.filter = "url(#smakr-diecut-default)";'
);

// 3. Fix global regex bug in createAquarellePinElement that overwrote inner <image width="26" height="26">
const oldPinGlyphBlock = `  const pinIconPx = isWeeklyPickVenue ? 42 : 37;
  const puckPx = isWeeklyPickVenue ? 50 : 46;
  const pinGlyph = curatedIcon
    ? \`<svg xmlns="http://www.w3.org/2000/svg" width="\${pinIconPx}" height="\${pinIconPx}" viewBox="-4 -4 32 32" style="overflow:visible !important; display:block;"><text x="12" y="13" font-size="21" text-anchor="middle" dominant-baseline="central" style="font-family:'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif; user-select:none;">\${curatedIcon}</text></svg>\`
    : iconSvg
        .replace(/width="\\d+"/g, \`width="\${pinIconPx}"\`)
        .replace(/height="\\d+"/g, \`height="\${pinIconPx}"\`);`;

const newPinGlyphBlock = `  const pinIconPx = isWeeklyPickVenue ? 44 : 39;
  const puckPx = isWeeklyPickVenue ? 50 : 46;
  const pinGlyph = curatedIcon
    ? \`<svg xmlns="http://www.w3.org/2000/svg" width="\${pinIconPx}" height="\${pinIconPx}" viewBox="-2 -2 28 28" style="overflow:visible !important; display:block;"><text x="12" y="13" font-size="21" text-anchor="middle" dominant-baseline="central" style="font-family:'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif; user-select:none;">\${curatedIcon}</text></svg>\`
    : iconSvg
        .replace(/width="\\d+"/, \`width="\${pinIconPx}"\`)
        .replace(/height="\\d+"/, \`height="\${pinIconPx}"\`);`;

if (!file.includes(oldPinGlyphBlock)) {
  throw new Error('oldPinGlyphBlock not found');
}
file = file.replace(oldPinGlyphBlock, newPinGlyphBlock);

// 4. Tighten dot margin-top from 3px to 1px under the 28x28 viewBox
file = file.replace(
  'margin-top: 3px; flex-shrink: 0;',
  'margin-top: 1px; flex-shrink: 0;'
);

// 5. Bump pinKey prefix to v3 so pooled markers rebuild immediately
file = file.replace(
  'const pinKey = `${venue.icon ?? ""}|',
  'const pinKey = `v3|${venue.icon ?? ""}|'
);

// 6. Ensure popup element always has z-index: 120 above all pins & mascot
const oldAttach = `    const attach = () => {
      if (venuePopupRef.current !== popup) return;
      popup.addTo(map);
      resetContainerScroll();
    };`;

const newAttach = `    const attach = () => {
      if (venuePopupRef.current !== popup) return;
      popup.addTo(map);
      const popupEl = popup.getElement();
      if (popupEl) {
        popupEl.style.zIndex = "120";
      }
      resetContainerScroll();
    };`;

if (!file.includes(oldAttach)) {
  throw new Error('oldAttach not found');
}
file = file.replace(oldAttach, newAttach);

if (isCrlf) {
  file = file.replace(/\n/g, '\r\n');
}
fs.writeFileSync(targetPath, file, 'utf8');
console.log('MapRadarView.tsx updated successfully.');
