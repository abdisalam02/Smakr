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

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const candidatesPath = path.resolve("curation/audits/new_oslo_candidates.json");
const candidates = JSON.parse(fs.readFileSync(candidatesPath, "utf8"));
const candidateNames = candidates.map((s) => s.name);

async function revert() {
  console.log("=== Reverting Seeded Candidates & Food Posts ===");

  // Find IDs of seeded venues
  const { data: venues, error: vErr } = await supabase
    .from("venues")
    .select("id, name")
    .in("name", candidateNames);

  if (vErr) {
    console.error("Error finding venues:", vErr);
    process.exit(1);
  }

  console.log(`Found ${venues?.length || 0} seeded venues to remove.`);

  if (venues && venues.length > 0) {
    const venueIds = venues.map((v) => v.id);

    // 1. Delete associated food_posts first (foreign key)
    const { count: postsDeleted, error: pErr } = await supabase
      .from("food_posts")
      .delete({ count: "exact" })
      .in("venue_id", venueIds);

    if (pErr) {
      console.error("Error deleting food_posts:", pErr);
    } else {
      console.log(`Deleted ${postsDeleted ?? 0} associated food_posts.`);
    }

    // 2. Delete venues
    const { count: venuesDeleted, error: delErr } = await supabase
      .from("venues")
      .delete({ count: "exact" })
      .in("id", venueIds);

    if (delErr) {
      console.error("Error deleting venues:", delErr);
    } else {
      console.log(`Deleted ${venuesDeleted ?? 0} venues.`);
    }
  }

  // Verify remaining venues count
  const { data: remainingVenues } = await supabase.from("venues").select("id, name");
  console.log(`Remaining venues in DB: ${remainingVenues?.length || 0}`);
  const { data: remainingPosts } = await supabase.from("food_posts").select("id");
  console.log(`Remaining food posts in DB: ${remainingPosts?.length || 0}`);
}

revert().catch(console.error);
