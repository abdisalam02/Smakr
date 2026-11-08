import fs from 'fs';
import path from 'path';

// Load spots
const spots = JSON.parse(fs.readFileSync('../curation/current_spots.json', 'utf8'));

// Test resolution matching MapRadarView logic
import { resolveEntityTaxonomy } from '../src/lib/taxonomy.js';
import { resolveCustomIconKey, FOOD_PIN_SVG_MAP } from '../src/components/food/FoodIcons.js';

console.log('Resolving map pin icons for all spots:');
for (const s of spots) {
  const taxonomy = resolveEntityTaxonomy(s);
  const dishCustomKey = resolveCustomIconKey(taxonomy.dishCategory);
  const explicitVenueIcon = s.icon ? resolveCustomIconKey(s.icon) : null;
  const categoryKey = taxonomy.dishCategory || s.food_category || 'all';
  const rawIcon = s.icon ? String(s.icon).replace(/[<>&"']/g, '').trim() : '';
  const customKey = dishCustomKey || explicitVenueIcon || resolveCustomIconKey(rawIcon) || resolveCustomIconKey(categoryKey);
  const iconKey = customKey || rawIcon || categoryKey;
  const svg = FOOD_PIN_SVG_MAP[iconKey] || FOOD_PIN_SVG_MAP[categoryKey] || FOOD_PIN_SVG_MAP.all;
  const hasImage = svg.includes('<image');
  const imageHref = hasImage ? (svg.match(/href="([^"]+)"/) || [])[1] : null;

  console.log(`- ${s.name}:`);
  console.log(`    dishCategory: "${taxonomy.dishCategory}", iconKey: "${iconKey}", pinImage: ${imageHref || 'VECTOR'}`);
}
