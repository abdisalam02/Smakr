import fs from "fs";

const content = fs.readFileSync("frontend/src/lib/taxonomy.ts", "utf8");
const lines = content.split("\n");

let balance = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (const ch of line) {
    if (ch === "{") balance++;
    if (ch === "}") balance--;
  }
  if (i >= 430 && i <= 620) {
    console.log(`${i + 1}: [bal=${balance}] ${line.trimEnd()}`);
  }
}
