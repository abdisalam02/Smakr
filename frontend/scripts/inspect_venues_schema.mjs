import fs from "fs";

const envContent = fs.readFileSync("frontend/.env.local", "utf8");
const env = {};
for (const line of envContent.split("\n")) {
  const idx = line.indexOf("=");
  if (idx !== -1) {
    const k = line.slice(0, idx).trim();
    let v = line.slice(idx + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    env[k] = v;
  }
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function check() {
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const r = await fetch(`${url}/rest/v1/venues?select=*&limit=1`, { headers });
  const data = await r.json();
  console.log("Venue columns:", Object.keys(data[0] || {}));

  const pr = await fetch(`${url}/rest/v1/food_posts?select=*&limit=1`, { headers });
  const pdata = await pr.json();
  console.log("Food post columns:", Object.keys(pdata[0] || {}));
}

check().catch(console.error);
