import fs from "fs";
import path from "path";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY");
  process.exit(1);
}

const brainDir = "C:/Users/abdis/.gemini/antigravity/brain/aa12b53b-04fa-4259-8560-24d7f40dbfbd";
const img1Path = path.join(brainDir, ".user_uploaded/media_1794090321631_6cad6a6a.jpg");
const img2Path = path.join(brainDir, ".user_uploaded/media_1794090673650_7eebc009.jpg");

const img1Base64 = fs.readFileSync(img1Path).toString("base64");
const img2Base64 = fs.readFileSync(img2Path).toString("base64");

const batch2Variations = [
  // ── GROUP 1: EVOLVING VAR 2 (WATERCOLOR WITH INK & HUMAN IMPERFECTIONS) ──
  {
    id: "var_7_culinary_journal_sketch",
    group: "Watercolor - Human Touch",
    name: "Var 7: Kyoto Culinary Journal Dip-Pen & Loose Wash",
    base64: img2Base64,
    prompt: `An authentic hand-drawn culinary sketchbook illustration inspired by Var 2. A cozy ceramic mug of matcha latte with delicate heart latte art, paired with an artisan bamboo whisk beside it.
Style: Vintage artist travel journal illustration using sepia dip-pen and loose watercolor wash.
Human imperfections: Hand-drawn ink line weight with natural hand tremors and tiny double-strokes, loose watercolor wash slightly bleeding outside the ink contours, visible raw cold-press paper grain with light watery droplets and faint pencil guide lines.
Palette: Warm oat milk cream, earthy jade matcha green, raw umber wood tones.
Strictly non-digital, zero 3D CGI gloss, authentic analog book illustration feel. Isolated on a pure solid white background.`
  },
  {
    id: "var_8_nordic_botanical_wash",
    group: "Watercolor - Human Touch",
    name: "Var 8: Nordic Minimalist Watercolor & Sepia Outline",
    base64: img2Base64,
    prompt: `A delicate Scandinavian watercolor and sepia ink illustration of a handmade ceramic cup filled with matcha latte and an artisan bamboo whisk.
Style: Soft botanical café menu artwork with intentional human touches.
Details: Loose, watery brushstrokes, natural pigment puddling at the cup base, subtle cauliflower water bloom on the green surface, hand-drawn wobbly ink lines, and dry-brush drag on the bamboo tines.
The cup is an asymmetric ceramic vessel with organic speckles.
Subdued matte natural colors on textured rag paper. Completely anti-AI, zero synthetic gradients. Isolated on pure white background.`
  },
  {
    id: "var_9_mingei_chawan_watercolor",
    group: "Watercolor - Human Touch",
    name: "Var 9: Japanese Mingei Folk-Art Watercolor & Whisk",
    base64: img1Base64,
    prompt: `An expressive artisanal watercolor painting of a handcrafted ceramic chawan bowl with a bamboo chasen whisk resting inside frothy green matcha.
Inspired by traditional Japanese Mingei folk-art illustrations:
Features loose sepia-brown brushwork, spontaneous wet-on-wet watercolor bleeding, authentic paper tooth grain, accidental ink spatter, and natural water ring marks.
The ceramic bowl has an earthy, irregular hand-thrown rim with pooling olive-green glaze.
Organic, human, imperfect, completely free of sterile digital smoothness. Isolated on pure solid white background.`
  },

  // ── GROUP 2: EVOLVING VAR 4 & VAR 5 (REALISTIC ARTISAN / TACTILE CRAFT) ──
  {
    id: "var_10_shino_glaze_chawan_realism",
    group: "Realistic Artisan - Transformative",
    name: "Var 10: Shino-Glazed Wabi-Sabi Bowl & Resting Whisk",
    base64: img1Base64,
    prompt: `A hyper-tactile, realistic culinary artisan food icon inspired by Var 4. A traditional Japanese matcha chawan bowl with a handcrafted bamboo chasen whisk.
Transformed original design to prevent copyright: The bowl is a rustic Japanese Shino-glazed ceramic vessel with warm apricot-orange iron speckles, crackled satin eggshell glaze, and an exposed rough sandy clay base.
Inside is thick, velvety ceremonial matcha with fine microscopic aeration bubbles and subtle swirl marks.
The bamboo whisk is made of unlacquered natural bamboo showing fibrous tines and realistic carved nodes, resting diagonally across the rim.
Natural soft directional morning window light, subtle soft contact shadow, zero CGI plastic sheen. Isolated on pure solid white.`
  },
  {
    id: "var_11_nordic_studio_mug_realism",
    group: "Realistic Artisan - Transformative",
    name: "Var 11: Nordic Potter Studio Mug & Rosetta Latte",
    base64: img2Base64,
    prompt: `A realistic, beautifully styled artisan beverage icon inspired by Var 5.
Transformative design: A contemporary Nordic studio pottery ceramic mug with a chunky handle, dipped in a rich sage-and-moss reactive glaze over toasted terracotta clay.
Filled with creamy oat milk matcha latte with an intricate, crisp multi-tiered tulip rosetta.
Lying gracefully beside the mug is an artisan bamboo whisk showing authentic bamboo fiber grain and delicate curved bristles.
Lighting: Warm diffused morning daylight highlighting the matte ceramic texture and satin foam. Zero CGI gloss, 100% authentic artisan café photo feel. Isolated on pure solid white.`
  },
  {
    id: "var_12_spouted_stoneware_action_realism",
    group: "Realistic Artisan - Transformative",
    name: "Var 12: Hand-Pinched Spouted Stoneware & Whisk in Foam",
    base64: img1Base64,
    prompt: `A realistic culinary macro icon of a traditional bamboo whisk actively resting in an artisan ceramic matcha bowl.
Transformative design: An asymmetric, hand-pinched cream stoneware bowl with a subtle pouring spout and coarse textured rim. The matcha features realistic aeration with varied bubble clusters, deep jade swirls, and surface tension around the bamboo tines.
The blonde bamboo whisk has ultra-detailed individual curved tines and natural wood pores.
Soft daylight, rich tactile textures, completely unique prop silhouette. Isolated on pure solid white background.`
  }
];

async function runBatch2() {
  const model = "gemini-3.1-flash-lite-image";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  console.log(`Starting Batch 2 test bench (6 variations)...`);

  for (const v of batch2Variations) {
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
                  data: v.base64
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

  console.log("\nBatch 2 completed!");
}

runBatch2();
