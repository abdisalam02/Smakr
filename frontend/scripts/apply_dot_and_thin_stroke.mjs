import fs from "fs";

const filePath = "frontend/src/components/map/MapRadarView.tsx";
let code = fs.readFileSync(filePath, "utf8");

// 1. Thinner stroke in SVG filters
code = code.replace(
  /<feMorphology in="SourceAlpha" operator="dilate" radius="1.8" result="dilated" \/>/,
  '<feMorphology in="SourceAlpha" operator="dilate" radius="0.9" result="dilated" />'
);
code = code.replace(
  /<feMorphology in="SourceAlpha" operator="dilate" radius="2.5" result="dilatedOuter" \/>/,
  '<feMorphology in="SourceAlpha" operator="dilate" radius="1.5" result="dilatedOuter" />'
);
code = code.replace(
  /<feMorphology in="SourceAlpha" operator="dilate" radius="1.8" result="dilatedInner" \/>/,
  '<feMorphology in="SourceAlpha" operator="dilate" radius="0.9" result="dilatedInner" />'
);

// 2. Replace triangle arrow in applyPinState
const oldApplyArrow = `  const arrow = root.querySelector<HTMLElement>(".smakr-puck-arrow");
  const isPopup = root.dataset.isPopup === "1";
  const isWeeklyPick = root.dataset.isWeeklyPick === "1";
  const baseIconPx = isWeeklyPick ? 34 : 30;
  const selectedIconPx = isWeeklyPick ? 37 : 33;
  if (puck) {
    if (isPopup) {
      if (isSelected) {
        puck.style.background = "#FFFFFF";
        puck.style.border = "1.5px solid #E84A27";
        puck.style.boxShadow = "0 0 0 3px rgba(232, 74, 39, 0.18), 0 6px 16px rgba(232, 74, 39, 0.20)";
      } else {
        puck.style.background = "#FAF7F2";
        puck.style.border = "1.5px solid rgba(232, 74, 39, 0.65)";
        puck.style.boxShadow = "0 3px 8px rgba(24, 22, 21, 0.12)";
      }
    } else {
      puck.style.background = "transparent";
      puck.style.border = "none";
      puck.style.borderRadius = "0";
      puck.style.boxShadow = "none";
      puck.style.overflow = "visible";
    }
  }
  if (iconContainer) {
    if (isPopup) {
      iconContainer.style.filter = "none";
    } else if (isSelected) {
      iconContainer.style.width = \`\${selectedIconPx}px\`;
      iconContainer.style.height = \`\${selectedIconPx}px\`;
      iconContainer.style.filter = "url(#smakr-diecut-selected)";
    } else {
      iconContainer.style.width = \`\${baseIconPx}px\`;
      iconContainer.style.height = \`\${baseIconPx}px\`;
      iconContainer.style.filter = "url(#smakr-diecut-default)";
    }
  }
  if (arrow) {
    if (isPopup) {
      arrow.style.borderTopColor = "#E84A27";
    } else {
      arrow.style.borderTopColor = isSelected ? "#E84A27" : "#FAF7F2";
    }
  }`;

const newApplyDot = `  const dot = root.querySelector<HTMLElement>(".smakr-puck-dot");
  const isPopup = root.dataset.isPopup === "1";
  const isWeeklyPick = root.dataset.isWeeklyPick === "1";
  const baseIconPx = isWeeklyPick ? 34 : 30;
  const selectedIconPx = isWeeklyPick ? 37 : 33;
  if (puck) {
    if (isPopup) {
      if (isSelected) {
        puck.style.background = "#FFFFFF";
        puck.style.border = "1.5px solid #E84A27";
        puck.style.boxShadow = "0 0 0 3px rgba(232, 74, 39, 0.18), 0 6px 16px rgba(232, 74, 39, 0.20)";
      } else {
        puck.style.background = "#FAF7F2";
        puck.style.border = "1.5px solid rgba(232, 74, 39, 0.65)";
        puck.style.boxShadow = "0 3px 8px rgba(24, 22, 21, 0.12)";
      }
    } else {
      puck.style.background = "transparent";
      puck.style.border = "none";
      puck.style.borderRadius = "0";
      puck.style.boxShadow = "none";
      puck.style.overflow = "visible";
    }
  }
  if (iconContainer) {
    if (isPopup) {
      iconContainer.style.filter = "none";
    } else if (isSelected) {
      iconContainer.style.width = \`\${selectedIconPx}px\`;
      iconContainer.style.height = \`\${selectedIconPx}px\`;
      iconContainer.style.filter = "url(#smakr-diecut-selected)";
    } else {
      iconContainer.style.width = \`\${baseIconPx}px\`;
      iconContainer.style.height = \`\${baseIconPx}px\`;
      iconContainer.style.filter = "url(#smakr-diecut-default)";
    }
  }
  if (dot) {
    if (isSelected) {
      dot.style.background = "#E84A27";
      dot.style.borderColor = "#E84A27";
      dot.style.transform = "translateX(-50%) scale(1.3)";
      dot.style.boxShadow = "0 0 0 2px rgba(232, 74, 39, 0.25), 0 2px 5px rgba(232, 74, 39, 0.4)";
    } else {
      dot.style.background = "#FAF7F2";
      dot.style.borderColor = isPopup ? "#E84A27" : "rgba(24, 22, 21, 0.28)";
      dot.style.transform = "translateX(-50%) scale(1.0)";
      dot.style.boxShadow = isPopup ? "0 1px 3px rgba(232, 74, 39, 0.35)" : "0 1px 3px rgba(24, 22, 21, 0.35)";
    }
  }`;

// Handle CRLF vs LF
const normalizedCode = code.replace(/\r\n/g, "\n");
const normalizedOld = oldApplyArrow.replace(/\r\n/g, "\n");
const normalizedNew = newApplyDot.replace(/\r\n/g, "\n");

if (normalizedCode.includes(normalizedOld)) {
  code = normalizedCode.replace(normalizedOld, normalizedNew).replace(/\n/g, "\r\n");
  console.log("Replaced applyPinState arrow with dot!");
} else {
  console.warn("Could not find exact applyPinState block");
}

// 3. Replace popup puck triangle
code = code.replace(
  /<!-- Pointer triangle -->\s*<div class="smakr-puck-arrow" style="[^"]*border-top:\s*4\.5px solid #E84A27;[^"]*"><\/div>/s,
  `<!-- Ground GPS anchor dot -->\r\n        <div class="smakr-puck-dot" style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); width: 5.5px; height: 5.5px; border-radius: 9999px; background: #FAF7F2; border: 1px solid #E84A27; box-shadow: 0 1px 3px rgba(232, 74, 39, 0.35); transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;"></div>`
);

// 4. Replace die-cut pin triangle
code = code.replace(
  /<!-- Downward pointer arrow beneath the floating icon -->\s*<div class="smakr-puck-arrow" style="[^"]*"><\/div>/s,
  `<!-- Ground GPS anchor dot beneath the floating icon -->\r\n        <div class="smakr-puck-dot" style="position: absolute; bottom: -3.5px; left: 50%; transform: translateX(-50%); width: 5.5px; height: 5.5px; border-radius: 9999px; background: #FAF7F2; border: 1px solid rgba(24, 22, 21, 0.28); box-shadow: 0 1px 3px rgba(24, 22, 21, 0.35); transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;"></div>`
);

fs.writeFileSync(filePath, code, "utf8");
console.log("Updated MapRadarView with thin strokes and white/orange ground dot!");
