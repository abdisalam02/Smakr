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
import { resolveEntityTaxonomy, resolveVenueDisplayBadge } from "../src/lib/taxonomy.ts";

const envPath = path.resolve("frontend/.env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, "");
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspect() {
  const { data: venues } = await supabase.from("venues").select("*").order("name");
  console.log(`Fetched ${venues.length} venues.\n`);

  for (const v of venues) {
    const tax = resolveEntityTaxonomy(v);
    const badge = resolveVenueDisplayBadge(v);
    console.log(`Venue: "${v.name}"`);
    console.log(`  DB category: "${v.category}", icon: "${v.vibe_signals?.icon}"`);
    console.log(`  Taxonomy: Group="${tax.group.id}" (${tax.group.shortLabel}), DishCat="${tax.dishCategory}" (${tax.dishLabel})`);
    console.log(`  Cuisines: [${tax.cuisines.join(", ")}]`);
    console.log(`  Badge: Flag="${badge.flag}", MainTag="${badge.mainTag}", PinIcon="${badge.pinIcon}"`);
    console.log("");
  }
}

inspect().catch(console.error);
