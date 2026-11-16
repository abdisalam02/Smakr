import fs from "fs";

let paneFile = fs.readFileSync("frontend/src/components/venue/VenueDetailPane.tsx", "utf8");
paneFile = paneFile.replace(
  'import { resolveEntityTaxonomy } from "@/lib/taxonomy";',
  'import { resolveEntityTaxonomy, resolveVenueDisplayBadge } from "@/lib/taxonomy";'
);
fs.writeFileSync("frontend/src/components/venue/VenueDetailPane.tsx", paneFile, "utf8");
console.log("VenueDetailPane.tsx import added.");
