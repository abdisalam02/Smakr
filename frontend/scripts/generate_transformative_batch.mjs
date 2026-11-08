import fs from "fs";
import path from "path";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY");
  process.exit(1);
}

const brainDir = "C:/Users/abdis/.gemini/antigravity/brain/aa12b53b-04fa-4259-8560-24d7f40dbfbd";
const mandiPath = path.join(brainDir, ".user_uploaded/media_1794092569227_5fe4ff3a.jpg");
const cheesesteakPath = path.join(brainDir, ".user_uploaded/media_1794092631345_4e07ca18.jpg");

const mandiBase64 = fs.readFileSync(mandiPath).toString("base64");
const cheesesteakBase64 = fs.readFileSync(cheesesteakPath).toString("base64");

const tasks = [
  // ── TRANSFORMED MANDI RICE (LEGAL & TRANSFORMED ORIGINAL DESIGN) ──
  {
    id: "var_21_mandi_transformed_realism",
    base64: mandiBase64,
    name: "Var 21: Transformed Mandi Rice Platter (Hero Plating, Turquoise Ceramic)",
    prompt: `Transform this reference photo into an entirely ORIGINAL, legally distinct culinary food icon.
Do NOT replicate the original photo's composition, platter, or 3-chicken arrangement.
New original composition:
- Vessel: An elegant oval handcrafted stoneware serving dish with an earthy turquoise reactive glaze and raw terracotta rim (NOT a round bronze tray).
- Food Arrangement: A single succulent, golden-roasted spiced chicken leg quarter resting atop a fragrant, fluffy mound of yellow saffron basmati rice.
- Garnish: Bright red ruby pomegranate seeds, toasted pine nuts, caramelized charred shallots, fresh sprigs of mint and coriander, with a wedge of charred Meyer lemon on the side.
- Perspective: 40-degree isometric tabletop angle showing appetizing food height and depth.
- Tactile Realism: Glistening crispy roasted skin with warm cumin-cardamom rub, individual aromatic rice grains, natural soft morning light, zero CGI sheen.
- Isolated on a pure solid white background with a soft matte contact shadow underneath for icon cutout.`
  },

  // ── TRANSFORMED CHEESESTEAK (LEGAL & TRANSFORMED ORIGINAL DESIGN) ──
  {
    id: "var_22_cheesesteak_transformed_realism",
    base64: cheesesteakBase64,
    name: "Var 22: Transformed Halved Cheesesteak Hero (Stacked Cross-Section)",
    prompt: `Transform this reference photo into an entirely ORIGINAL, legally distinct culinary food icon.
Do NOT replicate the single vertical hoagie orientation or background of the original photo.
New original composition:
- Sandwich Presentation: The cheesesteak is sliced in half crosswise at an angle, with one half resting dynamically propped against the other to showcase the dripping, decadent interior cross-section.
- Filling & Details: Layers of sizzling, thinly shaved ribeye steak seared with charred sweet red and green bell peppers, golden caramelized onions, and ribbons of molten white American and provolone cheese oozing from the center.
- Bread: Toasted artisan hoagie roll sprinkled with golden sesame seeds, with a crisp toasted edge and soft pillowy crumb.
- Perspective: 35-degree hero angle focusing on the juicy cut cross-section.
- Tactile Realism: Glistening meat juices, stringy melted cheese pull, crusty bread texture, natural daylight, zero foil wrapper, zero potato chips.
- Isolated on a pure solid white background with a subtle soft contact shadow underneath for icon cutout.`
  }
];

async function run() {
  const model = "gemini-3.1-flash-lite-image";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  console.log(`Starting Transformed Generation (${tasks.length} variations)...`);

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

  console.log("\nTransformed batch completed!");
}

run();
