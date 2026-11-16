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
  const vr = await fetch(`${url}/rest/v1/venues?select=name,image_url`, { headers });
  const vdata = await vr.json();
  vdata.forEach(v => console.log(v.name, '->', v.image_url ? v.image_url.slice(0, 50) : null));

  const pr = await fetch(`${url}/rest/v1/food_posts?select=dish_name,dish_image`, { headers });
  const pdata = await pr.json();
  pdata.forEach(p => console.log(p.dish_name, '->', p.dish_image ? p.dish_image.slice(0, 50) : null));
}

check().catch(console.error);
