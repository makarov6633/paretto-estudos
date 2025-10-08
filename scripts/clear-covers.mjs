import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "public", "media", "covers");
if (!fs.existsSync(dir)) {
  console.log("covers directory not found, nothing to delete:", dir);
  process.exit(0);
}

const entries = fs.readdirSync(dir, { withFileTypes: true });
for (const e of entries) {
  const p = path.join(dir, e.name);
  try {
    if (e.isDirectory()) fs.rmSync(p, { recursive: true, force: true });
    else fs.rmSync(p, { force: true });
    console.log("deleted", e.name);
  } catch (err) {
    console.warn("failed to delete", e.name, String(err?.message || err));
  }
}
console.log("done");
