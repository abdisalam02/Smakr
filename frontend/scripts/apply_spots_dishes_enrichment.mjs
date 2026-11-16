import fs from "fs";
import path from "path";

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class DummyWebSocket {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

import { createClient } from "@supabase/supabase-js";

const envPath = path.resolve("frontend/.env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, "");
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const data = JSON.parse(
    fs.readFileSync("frontend/curation/spots_dishes_enrichment.json", "utf8")
  );

  let updatedVenues = 0;
  let updatedDishes = 0;

  for (const item of data) {
    // 1. Update Venue description
    if (item.venue_id && item.description) {
      const { data: updatedV, error: vErr } = await supabase
        .from("venues")
        .update({ description: item.description })
        .eq("id", item.venue_id)
        .select("id, name");

      if (vErr) {
        console.error(`Error updating venue ${item.venue_name}:`, vErr.message);
      } else if (updatedV && updatedV.length > 0) {
        console.log(`✓ Updated venue: ${updatedV[0].name}`);
        updatedVenues++;
      } else {
        console.warn(`Venue ID not found: ${item.venue_name} (${item.venue_id})`);
      }
    }

    // 2. Update Dishes
    for (const d of item.dishes || []) {
      const dishUpdate = {};
      if (d.price_nok != null) dishUpdate.price_nok = d.price_nok;
      if (d.review_text) dishUpdate.review_text = d.review_text;
      if (d.taste_tags) dishUpdate.taste_tags = d.taste_tags;

      // Try matching by dish_id first
      let { data: updatedD, error: dErr } = await supabase
        .from("food_posts")
        .update(dishUpdate)
        .eq("id", d.dish_id)
        .select("id, dish_name");

      // Fallback: match by venue_id
      if ((!updatedD || updatedD.length === 0) && item.venue_id) {
        // If venue has posts, update the matching post
        const { data: vPosts } = await supabase
          .from("food_posts")
          .select("id, dish_name")
          .eq("venue_id", item.venue_id);

        if (vPosts && vPosts.length > 0) {
          // If only 1 post for this venue, it's the signature dish
          const targetPost = vPosts.length === 1 ? vPosts[0] : vPosts.find(p => 
            p.dish_name.toLowerCase().includes(d.dish_name.toLowerCase().split(" ")[0])
          ) || vPosts[0];

          const { data: fallbackD, error: fbErr } = await supabase
            .from("food_posts")
            .update(dishUpdate)
            .eq("id", targetPost.id)
            .select("id, dish_name");
          updatedD = fallbackD;
          dErr = fbErr;
        }
      }

      if (dErr) {
        console.error(`Error updating dish ${d.dish_name}:`, dErr.message);
      } else if (updatedD && updatedD.length > 0) {
        console.log(`  ✓ Updated dish: ${updatedD[0].dish_name} (${updatedD[0].id})`);
        updatedDishes++;
      } else {
        console.warn(`  Dish not found: ${d.dish_name} (${d.dish_id})`);
      }
    }
  }

  console.log(`\n🎉 Done! Updated ${updatedVenues} venues and ${updatedDishes} dishes in Supabase.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
