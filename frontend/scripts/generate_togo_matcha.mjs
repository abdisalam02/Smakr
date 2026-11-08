import fs from "fs";
import path from "path";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY");
  process.exit(1);
}

const brainDir = "C:/Users/abdis/.gemini/antigravity/brain/aa12b53b-04fa-4259-8560-24d7f40dbfbd";
const inspoPath = "frontend/public/test-icons/inspo_togo_blank_street.jpg";
const inspoBase64 = fs.readFileSync(inspoPath).toString("base64");

const togoVariations = [
  {
    id: "var_13_togo_sketch_watercolor",
    group: "Watercolor - Human Touch",
    name: "Var 13: Artisan Sketchbook Watercolor To-Go Cup",
    prompt: `Transform this reference photo into a hand-drawn culinary sketchbook watercolor food icon.
Subject: An iced matcha latte in a clear plastic takeaway to-go cup with a clear flat lid and a pastel green paper straw.
Layered drink: Vibrant ceremonial emerald matcha floating at the top, naturally swirling and marbling down into creamy white oat milk with translucent clinking ice cubes.
Style & Human Touch: Inspired by vintage travel journal food illustration. Fine sepia dip-pen contours with charming hand wobble, soft watercolor washes on 300gsm cold-press paper tooth, delicate water bleed stains, and light condensation droplet marks.
Strictly remove all brand logos/text from the cup (blank transparent cup).
Isolated on a pure solid white background with a clean silhouette for app map pin icon use.`
  },
  {
    id: "var_14_togo_lineless_watercolor",
    group: "Watercolor - Human Touch",
    name: "Var 14: Lineless Soft Watercolor To-Go Cup",
    prompt: `Transform this reference photo into a soft, lineless artisan watercolor food icon matching premium bakery map pins.
Subject: A clear to-go iced matcha latte cup with a transparent flat lid and angled straw.
Visuals: Beautiful organic ombre gradient of rich jade green matcha tea cascading into creamy milk over crystal ice cubes. Fine watercolor mist representing condensation on the cup exterior.
Medium: Pure hand-painted watercolor on textured rag paper, soft feathering pigment edges, natural paper grain tooth, zero digital vector harshness, zero plastic 3D CGI gloss.
Blank cup with no logos. Isolated on a pure solid white background.`
  },
  {
    id: "var_15_togo_scandi_realism",
    group: "Realistic Artisan - Transformative",
    name: "Var 15: Nordic Specialty Café Realism (Flat Lid & Straw)",
    prompt: `Transform this reference photo into a hyper-tactile, realistic artisan beverage icon.
Subject: An authentic iced matcha latte in a clear disposable to-go cup with a clear flat sip lid and an eco-friendly green paper straw.
Drink layers: Stunning marbled swirl of vibrant ceremonial grade jade-green matcha pouring down through white oat milk, with realistic crystal-clear ice cubes visible through the plastic. Fine micro-beads of chilled condensation on the cup exterior.
Tactile photography realism: Clean, completely unbranded cup (no text, no logos), natural diffused morning daylight, authentic reflections on the transparent plastic without CGI plastic sheen.
Isolated on a crisp pure solid white background with a soft matte contact shadow underneath.`
  },
  {
    id: "var_16_togo_dome_lid_realism",
    group: "Realistic Artisan - Transformative",
    name: "Var 16: Dome-Lid Cold Foam Matcha Realism",
    prompt: `Transform this reference photo into an artisan realistic to-go beverage icon with a clear rounded dome lid.
Subject: Chilled iced matcha latte in a transparent takeaway cup topped with a fluffy white cold foam layer under a clear dome lid, with an angled green straw.
Details: Rich emerald green matcha marbled with chilled milk, chunky transparent ice cubes, subtle exterior condensation droplets, realistic transparent plastic highlights.
Completely unbranded and original design. Soft natural café daylight, rich photographic depth.
Isolated on pure solid white background.`
  }
];

async function runTogoBatch() {
  const model = "gemini-3.1-flash-lite-image";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  console.log(`Starting To-Go Cup Matcha generation (${togoVariations.length} variations)...`);

  for (const v of togoVariations) {
    console.log(`\nGenerating: ${v.id} (${v.name})...`);
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
                  data: inspoBase64
                }
              },
              {
                text: v.prompt
              }
            ]
          }],
          generationConfig: {
            responseModalities: ["IMAGE"]
          }
        })
      });

      if (!res.ok) {
        console.error(`Failed ${v.id}: ${res.status}`, await res.text());
        continue;
      }

      const data = await res.json();
      const part = data.candidates?.[0]?.content?.parts?.[0];
      if (part?.inlineData?.data) {
        const outBuf = Buffer.from(part.inlineData.data, "base64");
        const outPathBrain = path.join(brainDir, `${v.id}.png`);
        const outPathPublic = path.join("frontend/public/test-icons", `${v.id}.png`);
        fs.writeFileSync(outPathBrain, outBuf);
        fs.writeFileSync(outPathPublic, outBuf);
        console.log(`SAVED ${v.id}.png (${outBuf.length} bytes) to brain & public!`);
      } else {
        console.error(`No image data for ${v.id}`);
      }
    } catch (e) {
      console.error(`Error on ${v.id}:`, e);
    }
  }

  console.log("\nTo-Go Cup batch completed!");
}

runTogoBatch();
