import fs from "fs";

const envFile = fs.existsSync("frontend/.env.local") ? "frontend/.env.local" : ".env.local";
const envContent = fs.readFileSync(envFile, "utf8");
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
  const r = await fetch(`${url}/rest/v1/profiles?select=id,handle,name,is_official`, { headers });
  console.log("Profiles status:", r.status);
  const data = await r.json();
  console.log("Profiles:", data);

  const vRes = await fetch(`${url}/rest/v1/venues?select=id,name`, { headers });
  const venues = await vRes.json();
  console.log("Current venue count:", venues.length);
}

check().catch(console.error);
