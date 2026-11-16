import fs from "fs";

const filePath = "frontend/src/components/map/MapRadarView.tsx";
let code = fs.readFileSync(filePath, "utf8");

// 1. getMapMascotDimensions and getUserAvatarDimensions
code = code.replace(
  /const height = Math\.round\(Math\.min\(92, Math\.max\(56, \(zoom - 10\) \* 9 \+ 44\)\)\);/,
  "const height = Math.round(Math.min(74, Math.max(45, (zoom - 10) * 7.2 + 35)));"
);
code = code.replace(
  /const height = Math\.round\(Math\.min\(58, Math\.max\(36, \(zoom - 10\) \* 5 \+ 31\)\)\);/,
  "const height = Math.round(Math.min(46, Math.max(29, (zoom - 10) * 4 + 25)));"
);

// 2. applyPinState baseIconPx & selectedIconPx
code = code.replace(
  /const baseIconPx = isWeeklyPick \? 42 : 37;/,
  "const baseIconPx = isWeeklyPick ? 34 : 30;"
);
code = code.replace(
  /const selectedIconPx = isWeeklyPick \? 46 : 41;/,
  "const selectedIconPx = isWeeklyPick ? 37 : 33;"
);

// 3. createAquarellePinElement root width & height
code = code.replace(
  /root\.style\.width = isWeeklyPickVenue \? "52px" : "48px";/,
  'root.style.width = isWeeklyPickVenue ? "42px" : "38px";'
);
code = code.replace(
  /root\.style\.height = isWeeklyPickVenue \? "58px" : "54px";/,
  'root.style.height = isWeeklyPickVenue ? "47px" : "44px";'
);

// 4. pinIconPx & puckPx in createAquarellePinElement
code = code.replace(
  /const pinIconPx = isWeeklyPickVenue \? 42 : 37;/,
  "const pinIconPx = isWeeklyPickVenue ? 34 : 30;"
);
code = code.replace(
  /const puckPx = isWeeklyPickVenue \? 50 : 46;/,
  "const puckPx = isWeeklyPickVenue ? 40 : 37;"
);

// 5. Popup ticket badge puck dimensions
code = code.replace(
  /width: 38px;\s*height: 38px;\s*border-radius: 12px;/,
  "width: 31px;\r\n        height: 31px;\r\n        border-radius: 10px;"
);
code = code.replace(
  /<div class="smakr-puck-icon" style="width:22px;height:22px;/,
  '<div class="smakr-puck-icon" style="width:18px;height:18px;'
);

// 6. leftOffset in updateInnerPlacement
code = code.replace(
  /const leftOffset = placeRight\s*\?\s*20 - Math\.round\(0\.0613 \* bustWidth\)\s*:\s*-20 - Math\.round\(0\.9387 \* bustWidth\);/,
  "const leftOffset = placeRight\r\n        ? 16 - Math.round(0.0613 * bustWidth)\r\n        : -16 - Math.round(0.9387 * bustWidth);"
);

// 7. Weekly badge font & padding
code = code.replace(
  /fontSize:\s*"9px",\s*fontWeight:\s*"700",\s*letterSpacing:\s*"0\.02em",\s*whiteSpace:\s*"nowrap",\s*padding:\s*"2px 7px",/,
  'fontSize: "8px",\r\n      fontWeight: "700",\r\n      letterSpacing: "0.02em",\r\n      whiteSpace: "nowrap",\r\n      padding: "1.5px 6px",'
);

fs.writeFileSync(filePath, code, "utf8");
console.log("Successfully resized map pins by ~20% in MapRadarView.tsx");
