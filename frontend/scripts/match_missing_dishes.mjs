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

async function inspectMissing() {
  const missingVenueIds = [
    { id: "6952e7c0-1ae9-4865-b81b-272858404d95", targetDish: "Cheeesy" },
    { id: "9320b20c-eb48-4a41-a3d5-a5bb34a74488", targetDish: "Søtbakst / Boller" },
    { id: "58e4a775-e75a-4322-8b48-7ed325e19ec5", targetDish: "Miso Ramen" },
    { id: "1527ec48-735f-47dc-9a3b-252f207be16b", targetDish: "Hot Chocolate" },
    { id: "15a5fef0-854e-4f11-bc6e-69f88995a98a", targetDish: "Beef Cheesesteak Sandwich" },
    { id: "d830b59b-f116-4c46-9d29-1c9f49392e21", targetDish: "Dirty Taco / Birria" },
    { id: "13ef316d-3173-455b-af80-a65c276f5787", targetDish: "Hot Chocolate" },
  ];

  for (const { id, targetDish } of missingVenueIds) {
    const { data: posts } = await supabase
      .from("food_posts")
      .select("id, venue_id, dish_name, price_nok, review_text")
      .eq("venue_id", id);
    const { data: v } = await supabase
      .from("venues")
      .select("id, name")
      .eq("id", id)
      .single();
    console.log(v?.name, `(target: ${targetDish}) -> existing posts in DB:`, posts);
  }
}

inspectMissing();
