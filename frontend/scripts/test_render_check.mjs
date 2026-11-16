import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const sharp = require("../node_modules/sharp");

const wBuf = fs.readFileSync("frontend/public/icons/food/croissant.webp");
const b64 = wBuf.toString("base64");
const svg = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <image href="data:image/webp;base64,${b64}" width="80" height="80"/>
</svg>`;

const { data } = await sharp(Buffer.from(svg)).raw().toBuffer({ resolveWithObject: true });
const nonZero = data.filter(x => x > 0).length;
console.log("Non-zero pixel bytes from webp in SVG:", nonZero);

// Now test with PNG
const pBuf = await sharp(wBuf).png().toBuffer();
const pb64 = pBuf.toString("base64");
const svgPng = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <image href="data:image/png;base64,${pb64}" width="80" height="80"/>
</svg>`;
const { data: dataPng } = await sharp(Buffer.from(svgPng)).raw().toBuffer({ resolveWithObject: true });
console.log("Non-zero pixel bytes from PNG in SVG:", dataPng.filter(x => x > 0).length);
