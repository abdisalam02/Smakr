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
const headFragment = rawSvg.slice(headStartIdx, headEndIdx + 4); // includes the groups

console.log("Head fragment extracted length:", headFragment.length);
console.log("Contains head:", headFragment.includes("matrix(.99789"));
console.log("Contains face:", headFragment.includes("translate(315 248)"));
console.log("Contains facialHair:", headFragment.includes("translate(279 400)"));
console.log("Contains glasses:", headFragment.includes("translate(203 303)"));
