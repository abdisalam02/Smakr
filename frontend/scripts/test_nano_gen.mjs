import fs from "fs";

const envFile = fs.existsSync(".env.local") ? ".env.local" : "frontend/.env.local";
const content = fs.readFileSync(envFile, "utf8");
const env = Object.fromEntries(
  content
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const [k, ...v] = l.split("=");
      return [k.trim(), v.join("=").trim().replace(/^"|"$/g, "")];
    })
);

console.log("Found env keys:", Object.keys(env).filter(k => k.includes("GEMINI") || k.includes("GOOGLE") || k.includes("KEY")));
const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || "";

async function testGen() {
  const model = "gemini-3.1-flash-lite-image";
  console.log("Testing with token length:", apiKey.length, "prefix:", apiKey.slice(0, 4));

  // Try Bearer
  const resBearer = await fetch(`https://generativelanguage.googleapis.com/v1beta/models`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  console.log("Models with Bearer status:", resBearer.status);
  const dataBearer = await resBearer.json();
  console.log("Bearer response:", JSON.stringify(dataBearer).slice(0, 150));

  // Try key
  const resKey = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const dataKey = await resKey.json();
  const modelInfo = dataKey.models.find(m => m.name.includes("gemini-3.1-flash-lite-image"));
  console.log("Model info:", JSON.stringify(modelInfo, null, 2));

  // Now test generation
  console.log("Testing generation on gemini-3.1-flash-lite-image...");
  const genRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-image:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: "A single watercolor food icon of Japanese souffle cloud pancakes with butter and syrup, lineless artisan watercolor illustration on pure white background, game icon style"
        }]
      }],
      generationConfig: {
        responseModalities: ["IMAGE"]
      }
    })
  });
  console.log("Gen status:", genRes.status);
  const genData = await genRes.json();
  if (genData.candidates && genData.candidates[0]?.content?.parts) {
    const parts = genData.candidates[0].content.parts;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (p.inlineData) {
        console.log(`Part ${i}: inlineData mime=${p.inlineData.mimeType}, len=${p.inlineData.data?.length}`);
        const buf = Buffer.from(p.inlineData.data, "base64");
        fs.writeFileSync("test_cloud_pancake.png", buf);
        console.log("SUCCESS! Saved test_cloud_pancake.png!");
      } else {
        console.log(`Part ${i}: text =`, p.text?.slice(0, 100));
      }
    }
  } else {
    console.log("Gen error / response:", JSON.stringify(genData, null, 2));
  }
}

testGen().catch(console.error);
