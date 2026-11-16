import fs from "fs";
import { createAvatar } from "@dicebear/core";
import * as openPeeps from "@dicebear/open-peeps";

const rawSvg = createAvatar(openPeeps, {
  seed: "sample",
  head: ["short1"],
  face: ["smile"],
  skinColor: ["edb98a"],
  headContrastColor: ["2c1b18"],
  accessories: ["glasses"],
  accessoriesProbability: 100,
  facialHair: ["full"],
  facialHairProbability: 100,
}).toString();

const headStartIdx = rawSvg.indexOf('<g transform="matrix(.99789 0 0 1 156 62)">');
const headEndIdx = rawSvg.lastIndexOf("</g></g></svg>");
const headFragment = rawSvg.slice(headStartIdx, headEndIdx + 4);

// Test coordinate transforms in viewBox 0 0 280 480
// Suppose scale = 0.35
// Center X: 140. Center of head in DiceBear is approx 395.
// 140 - 395 * 0.35 = 140 - 138.25 = 1.75
// Chin in DiceBear is approx 535.
// In 280x480, neck attaches at y = 140.
// 140 - 535 * 0.35 = 140 - 187.25 = -47.25

const testSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 480" width="280" height="480" style="background:#FAF7F2; border:1px solid #ddd;">
  <!-- Guide lines -->
  <line x1="140" y1="0" x2="140" y2="480" stroke="rgba(232,74,39,0.3)" stroke-width="1" stroke-dasharray="4"/>
  <line x1="0" y1="140" x2="280" y2="140" stroke="rgba(24,22,21,0.2)" stroke-width="1"/>
  
  <!-- Neck -->
  <path d="M126 125 L126 150 C126 156 154 156 154 150 L154 125 Z" fill="#edb98a" stroke="#181615" stroke-width="5" stroke-linejoin="round"/>
  
  <!-- Head scaled and positioned -->
  <g transform="translate(1.75, -47.25) scale(0.35)">
    ${headFragment}
  </g>
</svg>
`;

fs.writeFileSync("frontend/scripts/test_head_alignment.svg", testSvg, "utf8");
console.log("Saved test_head_alignment.svg");
