import fs from "fs";
import path from "path";

const candidates = JSON.parse(fs.readFileSync("curation/audits/new_oslo_candidates.json", "utf8"));
const auditMd = fs.readFileSync("frontend/curation/CANDIDATE_DISH_IMAGE_AUDIT.md", "utf8");

// Parse each spot section from CANDIDATE_DISH_IMAGE_AUDIT.md
// Spot sections start with `### <number>. <Name>`
const sections = auditMd.split(/### \d+\.\s+/).slice(1);
const auditData = {};

for (const sec of sections) {
  const lines = sec.split("\n");
  const name = lines[0].trim();
  
  // Extract direct photo receipts
  // URLs ending in jpg, jpeg, png, webp, gotobooking.imgix.net, imageproxy, or deliveryhero
  const urlMatches = [...sec.matchAll(/(https?:\/\/(?:gotobooking\.imgix\.net|imageproxy\.wolt\.com|images\.deliveryhero\.io|images\.happycow\.net|prod-pics\.guide\.michelin\.com)[^\s\)\`"']+|https?:\/\/[^\s\)\`"']+?\.(?:jpg|jpeg|png|webp)[^\s\)\`"']*)/gi)];
  const urls = urlMatches.map(m => m[1]);
  
  // Check if manual asset crop required (e.g. Izakaya)
  const isNeedsPhoto = sec.includes("Manual Asset Crop Required") || sec.includes("Needs Photo") || urls.length === 0;

  auditData[name.toLowerCase()] = {
    urls,
    isNeedsPhoto,
    rawName: name
  };
}

console.log("Parsed audit entries:", Object.keys(auditData).length);

const staged = candidates.map((spot, idx) => {
  const auditKey = Object.keys(auditData).find(k => spot.name.toLowerCase().includes(k) || k.includes(spot.name.toLowerCase()));
  const audit = auditKey ? auditData[auditKey] : null;

  const directUrls = audit?.urls || [];
  // For dishes, use the first food macro URL found
  // For cover, use second URL if available, else first or empty
  const dishPhotoUrl = directUrls.length > 0 ? directUrls[0] : "";
  const coverPhotoUrl = directUrls.length > 1 ? directUrls[1] : (directUrls.length === 1 ? directUrls[0] : "");

  const dishes = (spot.dish_highlights || []).map((dh, dIdx) => {
    const hasHttp = dishPhotoUrl.startsWith("http://") || dishPhotoUrl.startsWith("https://");
    const isBadKeyword = /streetview|facade|building|\/icons\/food\//i.test(dishPhotoUrl);
    const isVerified = Boolean(hasHttp && !isBadKeyword && !audit?.isNeedsPhoto);

    return {
      id: `${spot.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-dish-${dIdx + 1}`,
      dish_name: dh.dish_name,
      category: dh.category || spot.food_category || "street_food",
      price_nok: dh.price_nok || null,
      dish_image: dishPhotoUrl,
      is_verified_food_photo: isVerified,
      review_text: dh.review_text || spot.why_curated || "",
      taste_tags: dh.taste_tags || []
    };
  });

  const allDishesVerified = dishes.length > 0 && dishes.every(d => d.is_verified_food_photo);
  const status = allDishesVerified ? "approved" : "needs_photo";

  return {
    id: spot.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: spot.name,
    address: spot.address,
    neighborhood: spot.neighborhood,
    latitude: spot.coords[1],
    longitude: spot.coords[0],
    food_category: spot.food_category,
    icon: spot.icon || "restaurant",
    spot_type: spot.spot_type || "restaurant",
    cover_image_url: coverPhotoUrl,
    why_curated: spot.why_curated || "",
    verification_status: status,
    notes: audit?.isNeedsPhoto ? "Manual asset crop required before publishing to food_posts" : undefined,
    dish_highlights: dishes
  };
});

fs.writeFileSync("frontend/curation/staged_candidates.json", JSON.stringify(staged, null, 2), "utf8");
console.log(`Saved ${staged.length} staged candidates to frontend/curation/staged_candidates.json`);
console.log(`Status breakdown: Approved: ${staged.filter(s => s.verification_status === "approved").length}, Needs Photo: ${staged.filter(s => s.verification_status === "needs_photo").length}`);
