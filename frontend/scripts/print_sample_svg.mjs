import fs from "fs";
import { createAvatar } from "@dicebear/core";
import * as openPeeps from "@dicebear/open-peeps";

const svg = createAvatar(openPeeps, {
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

fs.writeFileSync("frontend/scripts/sample_peep.svg", svg, "utf8");
console.log("Written utf8 svg.");
