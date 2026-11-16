const fs = require('fs');
const path = require('path');

const env = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const anonKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();

async function run() {
  const [venuesRes, postsRes] = await Promise.all([
    fetch(url + '/rest/v1/venues?select=id,name,slug,address,neighborhood,category,description,signature_dishes,price_level,google_rating,created_at&order=name.asc', {
      headers: { apikey: anonKey, Authorization: 'Bearer ' + anonKey }
    }),
    fetch(url + '/rest/v1/food_posts?select=id,venue_id,dish_name,price_nok,review_text,taste_tags,category,is_archived&order=dish_name.asc', {
      headers: { apikey: anonKey, Authorization: 'Bearer ' + anonKey }
    })
  ]);

  const venues = await venuesRes.json();
  const posts = await postsRes.json();

  console.log(`Fetched ${venues.length} venues and ${posts.length} dishes.`);

  // Map posts to venues
  const venuePostsMap = new Map();
  for (const p of posts) {
    if (!venuePostsMap.has(p.venue_id)) {
      venuePostsMap.set(p.venue_id, []);
    }
    venuePostsMap.get(p.venue_id).push(p);
  }

  const backlogVenues = [];
  let totalMissingVenueDesc = 0;
  let totalMissingDishPrice = 0;
  let totalMissingDishReview = 0;
  let totalMissingDishTags = 0;

  for (const v of venues) {
    const vPosts = venuePostsMap.get(v.id) || [];
    const missingDesc = !v.description || v.description.trim().length < 30;
    if (missingDesc) totalMissingVenueDesc++;

    const problematicDishes = [];
    for (const p of vPosts) {
      if (p.is_archived) continue;
      const missingPrice = !p.price_nok || p.price_nok <= 0;
      const missingReview = !p.review_text || p.review_text.trim().length < 15;
      const missingTags = !p.taste_tags || p.taste_tags.length === 0;

      if (missingPrice) totalMissingDishPrice++;
      if (missingReview) totalMissingDishReview++;
      if (missingTags) totalMissingDishTags++;

      if (missingPrice || missingReview || missingTags) {
        problematicDishes.push({
          dish_id: p.id,
          dish_name: p.dish_name,
          category: p.category,
          current_price_nok: p.price_nok || null,
          current_review_text: p.review_text || "",
          current_taste_tags: p.taste_tags || [],
          lacking: [
            missingPrice ? "price_nok" : null,
            missingReview ? "review_text" : null,
            missingTags ? "taste_tags" : null,
          ].filter(Boolean)
        });
      }
    }

    if (missingDesc || problematicDishes.length > 0) {
      backlogVenues.push({
        venue_id: v.id,
        venue_name: v.name,
        address: v.address,
        neighborhood: v.neighborhood,
        category: v.category,
        price_level: v.price_level,
        has_description: !missingDesc,
        current_description: v.description || "",
        total_active_dishes: vPosts.filter(p => !p.is_archived).length,
        dishes_needing_enrichment: problematicDishes
      });
    }
  }

  // Create JSON file for programmatic seeding
  const jsonPath = path.join(__dirname, '../curation/SPOTS_AND_DISHES_ENRICHMENT_BACKLOG.json');
  fs.writeFileSync(jsonPath, JSON.stringify(backlogVenues, null, 2), 'utf8');

  // Create clean Markdown prompt file for the user to pass to research LLM
  const mdPath = path.join(__dirname, '../curation/SPOTS_AND_DISHES_ENRICHMENT_BACKLOG.md');
  let md = `# Smakr Oslo — Spots & Dishes Enrichment Backlog\n\n`;
  md += `> **Audit Date:** 2026-11-09  \n`;
  md += `> **Total Spots Audited:** ${venues.length}  \n`;
  md += `> **Spots Needing Editorial Description:** ${totalMissingVenueDesc}  \n`;
  md += `> **Dishes Needing Price (# NOK):** ${totalMissingDishPrice}  \n`;
  md += `> **Dishes Needing Tasting Notes / Review:** ${totalMissingDishReview}  \n`;
  md += `> **Dishes Needing Taste Tags:** ${totalMissingDishTags}  \n\n`;

  md += `## How to Use with a Research AI (Gemini / Perplexity / Claude)\n`;
  md += `Copy the prompt below and paste it into your research model. It will research authentic Oslo menu pricing, ingredients, and restaurant history and return the filled data formatted ready for Smakr.\n\n`;
  md += `\`\`\`text\n`;
  md += `You are an expert Oslo food journalist and culinary researcher for Smakr (an Oslo food discovery radar).\n`;
  md += `Research real menus, Wolt/Foodora Oslo listings, Google Maps reviews, and restaurant websites for the following Oslo food spots and their dishes.\n\n`;
  md += `For each spot:\n`;
  md += `1. Provide an authentic, concise editorial description (2–3 sentences) highlighting their culinary heritage, specialty technique, atmosphere, and what makes them special to Oslo locals. (No fluff or banned buzzwords like 'curated', 'elevate', 'seamless').\n`;
  md += `2. For each dish lacking a price, provide the authentic Oslo price in NOK (numeric integer, e.g. 195).\n`;
  md += `3. For each dish lacking a review, provide a vivid sensory 1–2 sentence review description of the textures, ingredients, and flavor profile.\n`;
  md += `4. Provide 2–3 specific taste tags (lowercase, e.g. ["crispy", "smoky", "fermented", "buttery", "springy"]).\n\n`;
  md += `Output valid JSON matching this schema:\n`;
  md += `[\n  {\n    "venue_id": "...",\n    "venue_name": "...",\n    "description": "...",\n    "dishes": [\n      {\n        "dish_id": "...",\n        "dish_name": "...",\n        "price_nok": 195,\n        "review_text": "...",\n        "taste_tags": ["..."]\n      }\n    ]\n  }\n]\n`;
  md += `\`\`\`\n\n`;

  md += `## Backlog List by Spot\n\n`;
  for (const b of backlogVenues) {
    md += `### ${b.venue_name} (${b.neighborhood || "Oslo"}, ${b.address})\n`;
    md += `- **Venue ID:** \`${b.venue_id}\`\n`;
    md += `- **Category:** \`${b.category || "restaurant"}\` | **Price Level:** \`${b.price_level || "$$"}\`\n`;
    md += `- **Restaurant Description Status:** ${b.has_description ? "✅ Exists" : "❌ **MISSING** (Needs 2-3 sentence editorial story)"}\n`;
    if (b.has_description) {
      md += `  > *Current:* "${b.current_description}"\n`;
    }
    if (b.dishes_needing_enrichment.length > 0) {
      md += `- **Dishes Needing Enrichment (${b.dishes_needing_enrichment.length}):**\n`;
      for (const d of b.dishes_needing_enrichment) {
        md += `  - **${d.dish_name}** (ID: \`${d.dish_id}\`)\n`;
        md += `    - Needs: **${d.lacking.join(", ")}**\n`;
        md += `    - Current Price: \`${d.current_price_nok ? d.current_price_nok + " kr" : "MISSING"}\`\n`;
        md += `    - Current Review: \`${d.current_review_text ? '"' + d.current_review_text + '"' : "MISSING"}\`\n`;
        md += `    - Current Taste Tags: \`${d.current_taste_tags.length ? JSON.stringify(d.current_taste_tags) : "MISSING"}\`\n`;
      }
    } else {
      md += `- **Dishes:** All dishes currently have prices and reviews.\n`;
    }
    md += `\n---\n\n`;
  }

  fs.writeFileSync(mdPath, md, 'utf8');
  console.log(`Successfully generated:\n- ${mdPath}\n- ${jsonPath}`);
  console.log(`Summary: ${backlogVenues.length} venues in backlog (${totalMissingVenueDesc} missing venue desc, ${totalMissingDishPrice} missing prices, ${totalMissingDishReview} missing reviews).`);
}

run();
