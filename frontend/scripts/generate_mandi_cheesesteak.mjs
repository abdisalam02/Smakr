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
  // ── MANDI RICE ──
  {
    id: "var_17_mandi_realism",
    base64: mandiBase64,
    name: "Var 17: Mandi Rice Platter Realism (Map Go-To)",
    prompt: `Transform this reference photo into a hyper-tactile, realistic culinary food icon.
Subject: An authentic Yemeni Mandi rice dish served on a round hammered copper-rimmed platter.
Details: Fluffy long-grain golden basmati rice seasoned with saffron and whole cardamom pods, topped with a tender roasted chicken quarter with deeply charred aromatic spice rub, crispy dark golden skin, garnished with toasted whole almonds, golden fried onions, fresh cilantro leaves, and a grilled lemon wedge.
Perspective: 35-degree tabletop view showing the round platter depth.
Tactile photography realism: Rich natural textures, glistening charred skin, individual rice grain separation, soft morning diffused daylight, zero CGI plastic sheen.
Isolated on a crisp pure solid white background with a subtle soft contact shadow underneath.`
  },
  {
    id: "var_18_mandi_watercolor",
    base64: mandiBase64,
    name: "Var 18: Mandi Rice Sketchbook Watercolor (Filter Dropdown)",
    prompt: `Transform this reference photo into a hand-drawn culinary sketchbook watercolor food icon.
Subject: An aromatic Mandi rice platter with spiced roasted chicken, toasted nuts, and herbs.
Style & Human Touch: Inspired by vintage travel culinary journals. Fine sepia dip-pen contours with charming hand wobble and slight line-weight tremor, loose watercolor washes on 300gsm cold-press paper tooth, vibrant saffron-yellow and golden-amber pigment puddling, delicate water bleed stains around the rim.
Organic, human, completely free of sterile digital vector smoothness.
Isolated on a pure solid white background with clean edges.`
  },

  // ── CHEESESTEAK ──
  {
    id: "var_19_cheesesteak_realism",
    base64: cheesesteakBase64,
    name: "Var 19: Philly Cheesesteak Realism (Map Go-To)",
    prompt: `Transform this reference photo into a hyper-tactile, realistic culinary food icon.
Subject: A mouthwatering artisan cheesesteak sandwich in a crusty, toasted golden hoagie roll.
Details: Generously stuffed with thinly shaved, sizzling seared ribeye beef steak, sweet caramelized onions, and stretchy melted golden-white cheese webbing flowing through the beef folds.
Perspective: 35-degree isometric hero angle showcasing the open sandwich filling and golden bread crust.
Tactile realism: Glistening juicy beef crust, melty cheese pull, crusty hoagie roll surface, natural diffused daylight, no potato chips, no foil wrapper.
Zero plastic CGI sheen. Isolated on a crisp pure solid white background with a subtle soft contact shadow underneath.`
  },
  {
    id: "var_20_cheesesteak_watercolor",
    base64: cheesesteakBase64,
    name: "Var 20: Cheesesteak Sketchbook Watercolor (Filter Dropdown)",
    prompt: `Transform this reference photo into a hand-drawn culinary sketchbook watercolor food icon.
Subject: A delicious toasted cheesesteak sub with shaved steak, caramelized onions, and melted cheese.
Style & Human Touch: Vintage culinary journal watercolor with fine sepia dip-pen linework. Hand-drawn ink contour wobble, loose savory amber and cheddar-yellow watercolor washes with soft bleeding edges, watery transparent stains on rough cold-press paper grain.
Completely anti-AI, zero 3D render feel, authentic analog cookbook illustration.
Isolated on a pure solid white background.`
  }
];

async function runBatch() {
  const model = "gemini-3.1-flash-lite-image";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  console.log(`Starting Mandi & Cheesesteak generation (${tasks.length} variations)...`);

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

  console.log("\nMandi & Cheesesteak batch completed!");
}

runBatch();
