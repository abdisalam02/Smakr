import { createAvatar } from "@dicebear/core";
import * as openPeeps from "@dicebear/open-peeps";

const svg = createAvatar(openPeeps, {
  seed: "test1",
  head: ["short1"],
  face: ["smile"],
  skinColor: ["edb98a"],
  headContrastColor: ["2c1b18"],
  accessories: ["glasses"],
  accessoriesProbability: 100,
  facialHair: ["full"],
  facialHairProbability: 100
}).toString();

// DiceBear Open Peeps viewBox is "0 0 704 704"
// The head/face lives inside from approx x: 120-580, y: 60-500
console.log("Has head group:", svg.includes('<g transform="matrix(.99789 0 0 1 156 62)">'));
console.log("Has face group:", svg.includes('<g transform="translate(315 248)">'));
