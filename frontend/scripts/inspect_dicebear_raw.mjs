import { createAvatar } from "@dicebear/core";
import * as openPeeps from "@dicebear/open-peeps";

const svg = createAvatar(openPeeps, {
  seed: "test",
  head: ["short1"],
  face: ["smile"],
  skinColor: ["edb98a"],
  headContrastColor: ["2c1b18"]
}).toString();

console.log("viewBox:", svg.match(/viewBox="[^"]+"/)?.[0]);
console.log("length:", svg.length);
const groups = svg.match(/<g[^>]*>/g) || [];
console.log("groups:", groups);
