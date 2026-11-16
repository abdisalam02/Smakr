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

const gKey = env.GOOGLE_PLACES_API_KEY;

async function testGoogle() {
  if (!gKey) {
    console.log("No Google API key");
    return;
  }
  const query = "Pele Pele Smalgangen Oslo";
  const url = `https://places.googleapis.com/v1/places:searchText`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": gKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.photos"
    },
    body: JSON.stringify({ textQuery: query })
  });
  console.log("Google Places API status:", res.status);
  const data = await res.json();
  console.log("Google response:", JSON.stringify(data, null, 2));
}

testGoogle().catch(console.error);
