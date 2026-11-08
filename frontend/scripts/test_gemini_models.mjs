import fs from "fs";

const content = fs.readFileSync(".env.local", "utf8");
const env = Object.fromEntries(
  content
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const [k, ...v] = l.split("=");
      return [k.trim(), v.join("=").trim().replace(/^"|"$/g, "")];
    })
);

const apiKey = env.GEMINI_API_KEY || env.GOOGLE_GENERATIVE_AI_API_KEY;
console.log("Has API key:", Boolean(apiKey));

async function main() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.models) {
    const imageModels = data.models.filter((m) =>
      m.name.toLowerCase().includes("image") ||
      m.name.toLowerCase().includes("imagen") ||
      m.name.toLowerCase().includes("banana") ||
      (m.supportedGenerationMethods && m.supportedGenerationMethods.some((g) => g.includes("image")))
    );
    console.log("Image-related models available on key:", imageModels.map((m) => ({ name: m.name, methods: m.supportedGenerationMethods })));
  } else {
    console.log("Response:", data);
  }
}

main().catch(console.error);
