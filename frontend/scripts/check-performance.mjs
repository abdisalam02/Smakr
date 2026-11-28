#!/usr/bin/env node
/**
 * Smakr Automated Performance & Responsiveness Guard Suite
 *
 * Checks asset budgets and key architectural invariants that keep mobile
 * startup, Map/Feed switching, card swipes, and sheets fast.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(rootDir, rel), "utf8");
const sizeKb = (rel) => fs.statSync(path.join(rootDir, rel)).size / 1024;

let total = 0;
let passed = 0;
let failed = 0;

function check(label, ok, detail = "") {
  total++;
  if (ok) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}${detail ? ` (${detail})` : ""}`);
  }
}

console.log("\n⚡ Running Smakr Performance & Responsiveness Guard Suite...\n");

console.log("[1] Static Asset Budgets");
check("Boot Oslo map backdrop <= 65 KB", sizeKb("public/boot/oslo-map-backdrop.webp") <= 65, `${sizeKb("public/boot/oslo-map-backdrop.webp").toFixed(1)} KB`);
check("Baked Peeps atlas <= 450 KB", sizeKb("public/boot/peeps-atlas-baked.webp") <= 450, `${sizeKb("public/boot/peeps-atlas-baked.webp").toFixed(1)} KB`);

const foodIconsDir = path.join(rootDir, "public/icons/food");
const oversizedIcons = fs
  .readdirSync(foodIconsDir)
  .filter((f) => f.endsWith(".webp"))
  .filter((f) => fs.statSync(path.join(foodIconsDir, f)).size > 120 * 1024);
check("All food WebP icons <= 120 KB", oversizedIcons.length === 0, oversizedIcons.join(", "));

console.log("\n[2] Boot Screen & Preload Invariants");
const layoutSrc = read("src/app/layout.tsx");
const bootSrc = read("src/components/ui/PeepsBootScreen.tsx");
check("layout.tsx preloads /boot/oslo-map-backdrop.webp", layoutSrc.includes('href="/boot/oslo-map-backdrop.webp"'));
check("layout.tsx preloads /boot/peeps-atlas-baked.webp", layoutSrc.includes('href="/boot/peeps-atlas-baked.webp"'));
check("PeepsBootScreen avoids radial-gradient backdrop", !bootSrc.includes("radial-gradient("));
check("PeepsBootScreen avoids 100vh / min-h-screen", !/(100vh|min-h-screen)/.test(bootSrc));

console.log("\n[3] Mobile Feed <-> Map Switching & Touch Latency");
const homeSrc = read("src/components/home/HomeView.tsx");
const dockSrc = read("src/components/map/MapNeighborhoodDock.tsx");
const sheetSrc = read("src/components/venue/VenueBottomSheet.tsx");

check("HomeView keeps mobile Feed mounted when switching to Map", !homeSrc.includes('{viewMode !== "map" && ('));
check("HomeView pauses MapLibre when mobile Feed covers map", homeSrc.includes('(!isDesktop && viewMode !== "map")'));
check("MapNeighborhoodDock keeps active spotlight card interactive", dockSrc.includes("effectiveSlot === 0") && dockSrc.includes('isCentered || focus > 0.65 ? "auto" : "none"'));
check("MapNeighborhoodDock opens VenueBottomSheet synchronously", !/setTimeout\(\(\)\s*=>\s*setIsVenueDetailModalOpen\(true\)/.test(dockSrc));
check("VenueBottomSheet scrim avoids expensive backdrop-blur", !/backdrop-blur-\[2px\].*handleClose|handleClose[\s\S]{0,120}backdrop-blur-\[2px\]/.test(sheetSrc));
check("VenueBottomSheet allows vertical pull-down over horizontal carousels", !sheetSrc.includes('if (target?.closest(\'[data-horizontal-carousel="true"]\'))'));
check("Core mobile surfaces avoid 100vh / min-h-screen", !/(100vh|min-h-screen)/.test(homeSrc) && !/(100vh|min-h-screen)/.test(sheetSrc));

console.log(`\n==========================================\n  Checks completed: ${total}\n  Passed: ${passed}\n  Failed: ${failed}\n==========================================\n`);
if (failed > 0) process.exit(1);
