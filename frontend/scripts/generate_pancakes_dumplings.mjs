import fs from "fs";
import path from "path";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY");
  process.exit(1);
}

const brainDir = "C:/Users/abdis/.gemini/antigravity/brain/aa12b53b-04fa-4259-8560-24d7f40dbfbd";
const pancakePath = path.join(brainDir, ".user_uploaded/media_1794094422308_b0e1ef80.jpg");
const dumplingPath = path.join(brainDir, ".user_uploaded/media_1794094462435_ae8ee99c.jpg");

const pancakeBase64 = fs.readFileSync(pancakePath).toString("base64");
const dumplingBase64 = fs.readFileSync(dumplingPath).toString("base64");

const tasks = [
  // ── PANCAKES ──
  {
    id: "var_23_pancakes_realism",
    base64: pancakeBase64,
    name: "Var 23: Japanese Souffle Cloud Pancakes Realism (Map Go-To)",
    prompt: `Transform this reference photo into an entirely ORIGINAL, legally distinct culinary food icon.
Do NOT replicate the original photo's composition, pitcher pour, or background.
New original composition:
- Food: A towering stack of two jiggly, ultra-fluffy Japanese souffle cloud pancakes with golden toasted tops and airy custard-like souffle edges.
- Toppings: A melting pat of whipped golden salted butter on top, warm amber maple syrup oozing and dripping down the sides, garnished with fresh wild blueberries, sliced ripe strawberries, and a dusting of powdered sugar.
- Vessel: Served on a handcrafted artisan cream stoneware plate with an exposed toasted terracotta rim.
- Perspective: 35-degree isometric hero view showing the dramatic fluffy pancake height and depth.
- Tactile Realism: Fluffy sponge texture, glistening syrup drips, natural soft morning window light, zero CGI sheen.
- Isolated on a crisp pure solid white background with a soft subtle contact shadow underneath for icon cutout.`
  },
  {
    id: "var_24_pancakes_watercolor",
    base64: pancakeBase64,
    name: "Var 24: Souffle Pancakes Sketchbook Watercolor (Filter Dropdown)",
    prompt: `Transform this reference photo into a hand-drawn culinary sketchbook watercolor food icon.
Subject: Fluffy Japanese souffle cloud pancakes with melting butter and maple syrup drip.
Style & Human Touch: Inspired by vintage travel culinary journals. Fine sepia dip-pen contours with charming hand wobble and slight line tremor, loose watercolor washes on 300gsm cold-press paper tooth, warm golden butter and amber maple syrup puddling, delicate water bleed stains.
Completely anti-AI, zero 3D render feel, authentic analog cookbook illustration.
Isolated on a pure solid white background.`
  },

  // ── SOUP DUMPLINGS (XIAO LONG BAO) ──
  {
    id: "var_25_dumplings_realism",
    base64: dumplingBase64,
    name: "Var 25: Bamboo Steamer Soup Dumplings Realism (Map Go-To)",
    prompt: `Transform this reference photo into an entirely ORIGINAL, legally distinct culinary food icon.
Do NOT replicate the exact photo's arrangement or dark table.
New original composition:
- Vessel: A traditional blonde woven bamboo steamer basket with its woven lid leaning gracefully against the side.
- Food: 4 delicately pleated soup dumplings (Xiao Long Bao) nestled inside on perforated parchment paper, showing translucent dough stretched gently over rich savory broth and meat filling.
- Accents: Accompanied by a small rustic white ceramic sauce dish filled with dark aged vinegar, ginger matchsticks, and aromatic red chili oil.
- Perspective: 40-degree tabletop isometric angle showing the steamer depth, dumplings, and dipping dish.
- Tactile Realism: Woven bamboo textures, delicate dumpling pleats, glistening chili oil, natural soft daylight, zero plastic CGI sheen.
- Isolated on a crisp pure solid white background with a subtle soft contact shadow underneath for icon cutout.`
  },
  {
    id: "var_26_dumplings_watercolor",
    base64: dumplingBase64,
    name: "Var 26: Steamer Dumplings Sketchbook Watercolor (Filter Dropdown)",
    prompt: `Transform this reference photo into a hand-drawn culinary sketchbook watercolor food icon.
Subject: A round bamboo steamer basket with delicately pleated soup dumplings and a chili oil dipping dish.
Style & Human Touch: Vintage Asian culinary travel sketchbook. Fine sepia dip-pen linework with natural wobble, loose watery bamboo wood washes, delicate translucent dough watercolor highlights on rough cold-press paper grain, subtle water bleed puddles.
Organic, human, authentic analog book illustration.
Isolated on a pure solid white background.`
  }
];

async function run() {
  const model = "gemini-3.1-flash-lite-image";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  console.log(`Starting Pancakes & Dumplings generation (${tasks.length} variations)...`);

  for (const t of tasks) {
    console.log(`\nGenerating: ${t.id} (${t.name})...`);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: t.base64
                }
              },
              {
                text: t.prompt
              }
            ]
          }],
          generationConfig: {
            responseModalities: ["IMAGE"]
          }
        })
      });

      if (!res.ok) {
        console.error(`Failed ${t.id}: ${res.status}`, await res.text());
        continue;
      }

      const data = await res.json();
      const part = data.candidates?.[0]?.content?.parts?.[0];
      if (part?.inlineData?.data) {
        const outBuf = Buffer.from(part.inlineData.data, "base64");
        const outPathBrain = path.join(brainDir, `${t.id}.png`);
        const outPathPublic = path.join("frontend/public/test-icons", `${t.id}.png`);
        fs.writeFileSync(outPathBrain, outBuf);
        fs.writeFileSync(outPathPublic, outBuf);
        console.log(`SAVED ${t.id}.png (${outBuf.length} bytes) to brain & public!`);
      } else {
        console.error(`No image data for ${t.id}`);
      }
    } catch (e) {
      console.error(`Error on ${t.id}:`, e);
    }
  }

  console.log("\nPancakes & Dumplings batch completed!");
}

run();
