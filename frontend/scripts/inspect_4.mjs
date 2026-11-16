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

async function check() {
  const ids = [
    "29305b8b-4938-4989-81e3-4a18813be6cf",
    "6c0c16d2-d919-4ec2-9834-dcd6aa9bc2a1",
    "579a51b3-ebb5-4638-a64c-8aed027563bd",
    "a9bc2f3b-0714-4a12-863a-2517e9bab590",
  ];
  for (const id of ids) {
    const { data: v } = await supabase.from("venues").select("id, name").eq("id", id).single();
    const { data: p } = await supabase.from("food_posts").select("id, dish_name, price_nok, review_text").eq("venue_id", id);
    console.log(v?.name, "-> posts in DB:", p);
  }
}
check();
