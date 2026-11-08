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

const promptVariations = [
  // ── GROUP 1: WATERCOLOR WITH ORGANIC HUMAN IMPERFECTIONS ──
  {
    id: "var_1_wabi_sabi_watercolor",
    group: "Watercolor - Human Touch",
    name: "Wabi-Sabi Watercolor with Pigment Blooms & Raw Paper Tooth",
    base64: img1Base64,
    prompt: `An authentic hand-painted watercolor culinary illustration of a traditional Japanese matcha chawan bowl with a bamboo chasen whisk resting inside. 
Painted on rough 300gsm cold-press cotton rag paper with deep visible paper tooth and grain.
Embrace real human artistic imperfections: unpredictable pigment blooms (cauliflower back-runs), uneven water-to-paint pooling along the bowl rim, faint hesitant sepia dip-pen contours with varying line weight, delicate dry-brush drag marks on the bamboo whisk, and subtle paint smudges.
Vibrant ceremonial jade-green watercolor wash with granulated pigment settling into the paper texture.
Non-digital, non-CGI, strictly organic analog painterly feel. Isolated on a pure solid white background with a clean silhouette for icon use.`
  },
  {
    id: "var_2_cafe_menu_sketch",
    group: "Watercolor - Human Touch",
    name: "Artisan Café Menu Watercolor & Sepia Dip-Pen Sketch",
    base64: img2Base64,
    prompt: `A charming hand-drawn café menu illustration of a cozy ceramic mug of matcha latte with delicate hand-poured heart latte art, paired with an artisan bamboo whisk beside it.
Style: Vintage culinary sketchbook watercolor with loose sepia ink linework.
Human touches: Slightly asymmetrical hand-thrown cup shape, natural hand-drawn ink wobble, organic watercolor washes with soft bleeding edges, watery transparent stains, and light pigment puddling at the base.
Warm earthy cream and matcha-green palette, painted on textured off-white watercolor paper.
Anti-digital, zero synthetic smoothness, zero 3D render look. Isolated on a pure solid white background.`
  },
  {
    id: "var_3_botanical_field_study",
    group: "Watercolor - Human Touch",
    name: "Loose Botanical Field-Study Watercolor with Water Rings",
    base64: img1Base64,
    prompt: `A loose, expressive culinary watercolor study of a handcrafted matcha bowl and whisk.
Features visible physical watercolor physics: soft water rings, granulated olive-and-jade pigment washes, watery bleed edges, and spontaneous brushstrokes.
The bamboo whisk has delicate hand-painted fine tines with subtle bristle imperfections. The ceramic bowl has organic rustic speckles and soft watercolor pooling.
Visible paper grain texture, scanned physical watercolor artwork feel, completely free of artificial digital gradients or vector plasticity.
Isolated on a crisp white background with clean edges.`
  },

  // ── GROUP 2: REALISTIC ARTISAN (ORIGINAL & NON-COPYRIGHTED) ──
  {
    id: "var_4_handthrown_stoneware_realism",
    group: "Realistic Artisan - Transformative",
    name: "Hand-Thrown Speckled Stoneware & Carved Bamboo (Tactile Realism)",
    base64: img1Base64,
    prompt: `A hyper-tactile, realistic culinary food icon of a freshly whisked ceremonial matcha in an organic hand-pinched ceramic chawan bowl with a bamboo chasen whisk.
Transformed original design to avoid copying: The bowl is an asymmetrical, wabi-sabi hand-thrown stoneware vessel with exposed rough clay at the bottom and a satin eggshell glaze with natural iron flecks. The bamboo whisk is positioned at an inviting 35-degree diagonal angle with visible natural bamboo grain, fibrous cut tines, and a dark thread binding.
The matcha foam features authentic micro-aeration with varying bubble clusters and velvety emerald broth.
Natural soft morning window lighting, subtle matte contact shadow beneath. Zero plastic gloss, zero generic CGI sheen, authentic artisan Scandinavian/Japanese café aesthetic. Isolated on pure solid white.`
  },
  {
    id: "var_5_dripped_glaze_latte_realism",
    group: "Realistic Artisan - Transformative",
    name: "Artisan Dripped-Glaze Mug with Latte Tulip & Rested Whisk",
    base64: img2Base64,
    prompt: `A realistic, beautifully styled artisan beverage icon featuring a ceramic matcha latte mug and a handcrafted bamboo whisk resting next to it.
Completely transformed from the reference: The mug is a handcrafted fluted mug with a rich sage-green reactive glaze dripping over natural beige stoneware. Inside is a frothy oat milk matcha latte with a crisp hand-poured multi-tiered tulip Rosetta.
Beside the cup lies a traditional unlacquered golden bamboo whisk showing natural wood pores and delicate curved tines.
Lighting: Warm soft diffused natural daylight, rich organic material textures, completely original silhouette and composition. Isolated on a clean solid white background.`
  },
  {
    id: "var_6_kyoto_master_whisk_realism",
    group: "Realistic Artisan - Transformative",
    name: "Kyoto Whisk In-Motion Macro Realism",
    base64: img1Base64,
    prompt: `An artisan realistic culinary close-up icon of a traditional bamboo matcha whisk standing inside a rustic dark volcanic clay chawan bowl filled with frothy matcha.
Original design transformation: Dark charcoal-brown textured stoneware bowl that makes the vivid jade-green matcha foam pop dramatically. The whisk features hand-carved blonde bamboo with ultra-detailed individual tines cutting through the foam, creating natural ripple rings and frothy crests.
Tactile, authentic food photography feel with warm side-lighting, organic material depth, and no artificial smoothness. Isolated on pure solid white.`
  }
];

async function runTestBench() {
  const model = "gemini-3.1-flash-lite-image";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  console.log(`Starting prompt research test bench (${promptVariations.length} variations)...`);

  for (const v of promptVariations) {
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
        const outPath = path.join(brainDir, `${v.id}.png`);
        fs.writeFileSync(outPath, outBuf);
        console.log(`SAVED ${v.id}.png (${outBuf.length} bytes)`);
      } else {
        console.error(`No image data for ${v.id}`);
      }
    } catch (e) {
      console.error(`Error on ${v.id}:`, e);
    }
  }

  console.log("\nAll variations completed!");
}

runTestBench();
