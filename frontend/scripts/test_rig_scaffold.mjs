import fs from "fs";
import { createAvatar } from "@dicebear/core";
import * as openPeeps from "@dicebear/open-peeps";

// Test script to verify head alignment with neck
const testConfigs = [
  { head: "short1", face: "smile", hair: "2c1b18", skin: "ffdbb4", top: "e84a27", bottom: "262e33" },
  { head: "medium1", face: "lovingGrin1", hair: "a55728", skin: "edb98a", top: "fdea6b", bottom: "181615" },
  { head: "afro", face: "eatingHappy", hair: "2c1b18", skin: "694d3d", top: "78e185", bottom: "3b4d5e" },
  { head: "hatBeanie", face: "cheeky", hair: "d6b370", skin: "d08b5b", top: "8fa7df", bottom: "d6cbb9" },
  { head: "dreads1", face: "smileBig", hair: "2c1b18", skin: "ae5d29", top: "e279c7", bottom: "4a3728" },
];

console.log("Ready to build full body test generator.");
