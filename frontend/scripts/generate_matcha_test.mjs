import fs from "fs";
import path from "path";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY in process.env");
  process.exit(1);
}

const brainDir = "C:/Users/abdis/.gemini/antigravity/brain/aa12b53b-04fa-4259-8560-24d7f40dbfbd";
const img1Path = path.join(brainDir, ".user_uploaded/media_1794090321631_6cad6a6a.jpg");
const img2Path = path.join(brainDir, ".user_uploaded/media_1794090673650_7eebc009.jpg");

const img1Base64 = fs.readFileSync(img1Path).toString("base64");
const img2Base64 = fs.readFileSync(img2Path).toString("base64");

const tasks = [
  {
    name: "matcha_1_realistic",
    base64: img1Base64,
    prompt: `Transform this reference photo into a standalone, original culinary food icon with a realistic illustrated touch. Show a traditional handcrafted bamboo matcha whisk (chasen) actively frothing in a textured ceramic chawan bowl with vibrant jade-green foamy matcha bubbles. Do not copy the photo directly: change the bowl silhouette to an organic hand-thrown ceramic with subtle warm speckles, adjust the whisk angle to an inviting 35-degree tabletop view. Isolated on a crisp pure solid white background, clean silhouette, no cloth, no spoons, no stray powder. Rich detailed textures, natural light, premium restaurant food icon style.`
  },
  {
    name: "matcha_1_watercolor",
    base64: img1Base64,
    prompt: `Transform this reference photo into a hand-painted watercolor and gouache food icon. Show a traditional bamboo matcha whisk (chasen) resting in a speckled cream ceramic bowl filled with vibrant frothy green matcha tea. Lineless artisan watercolor style on pure white background: soft organic pigment bleeds, subtle warm sepia brushed contour accents, visible handmade paper texture, soft matte highlights (no plastic 3D CGI gloss). Isolated clean cutout, no shadows cutting the frame, no cloths or spoons. Matches hand-drawn artisan cafe menu icons.`
  },
  {
    name: "matcha_2_realistic",
    base64: img2Base64,
    prompt: `Transform this reference photo into a standalone, original culinary beverage icon with a realistic illustrated touch. Show an earthenware ceramic cup filled with a creamy matcha latte decorated with delicate tulip latte art, accompanied alongside by a traditional bamboo chasen whisk resting at an angle. Do not copy the photo: change the cup shape to a cozy fluted ceramic mug with earthy glaze, omit the metal sifter and wooden table. Isolated on a crisp pure solid white background, 35-degree isometric tabletop view, natural soft morning light, rich realistic textures without CGI plastic shine.`
  },
  {
    name: "matcha_2_watercolor",
    base64: img2Base64,
    prompt: `Transform this reference photo into a hand-painted watercolor and gouache food icon. Show a cozy ceramic cup of velvety jade-green matcha latte with white heart latte art, paired with an artisan bamboo matcha whisk (chasen) beside it. Lineless artisan watercolor style on pure white background: soft organic pigment washes, delicate warm sepia brushed edges, natural paper grain, soft matte lighting. Isolated clean silhouette, no tabletop, no sifter, no harsh black lines. Matches hand-painted culinary watercolor food icons.`
  }
];

async function generateAll() {
  const model = "gemini-3.1-flash-lite-image";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  for (const t of tasks) {
    console.log(`\nGenerating ${t.name}...`);
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
        const errText = await res.text();
        console.error(`Failed ${t.name}: status ${res.status}`, errText);
        continue;
      }

      const data = await res.json();
      const part = data.candidates?.[0]?.content?.parts?.[0];
      if (part?.inlineData?.data) {
        const outBuf = Buffer.from(part.inlineData.data, "base64");
        const outPath = path.join(brainDir, `${t.name}.png`);
        fs.writeFileSync(outPath, outBuf);
        console.log(`Saved ${t.name}.png (${outBuf.length} bytes) to ${outPath}`);
      } else {
        console.error(`No inlineData in response for ${t.name}:`, JSON.stringify(data).slice(0, 200));
      }
    } catch (err) {
      console.error(`Error generating ${t.name}:`, err);
    }
  }
}

generateAll();
