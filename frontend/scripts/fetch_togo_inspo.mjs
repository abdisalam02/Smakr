import fs from "fs";

async function fetchInspo() {
  const pages = [
    "https://unsplash.com/photos/a-matcha-latte-in-a-plastic-cup-dbeca0c256ab",
    "https://unsplash.com/photos/green-matcha-latte-in-a-plastic-cup-0b6206cda4fd",
    "https://unsplash.com/s/photos/iced-matcha-latte"
  ];

  for (const p of pages) {
    try {
      console.log("Checking:", p);
      const res = await fetch(p, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      const html = await res.text();
      const matches = html.match(/https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+/g);
      if (matches && matches.length > 0) {
        // pick a distinct photo url
        const unique = [...new Set(matches)].filter(u => !u.includes("profile"));
        console.log("Found image candidates:", unique.slice(0, 3));
        const chosen = unique[0] + "?auto=format&fit=crop&w=800&q=80";
        console.log("Downloading:", chosen);
        const imgRes = await fetch(chosen);
        const buf = Buffer.from(await imgRes.arrayBuffer());
        fs.writeFileSync("frontend/public/test-icons/inspo_togo_matcha.jpg", buf);
        console.log("Successfully saved inspo_togo_matcha.jpg, bytes:", buf.length);
        return;
      }
    } catch (err) {
      console.error("Error on", p, err.message);
    }
  }
}

fetchInspo();
