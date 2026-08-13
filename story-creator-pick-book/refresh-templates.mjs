#!/usr/bin/env node
/**
 * Refresh local templates.json from the production API.
 * Usage: node refresh-templates.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_URL =
  "https://tiny-tale-backend-production.up.railway.app/v1/templates?language=he";
const outPath = path.join(__dirname, "templates.json");

const response = await fetch(API_URL);
if (!response.ok) {
  console.error(`Fetch failed: ${response.status} ${response.statusText}`);
  process.exit(1);
}

const data = await response.json();
fs.writeFileSync(outPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(
  `Wrote ${data.templates?.length ?? 0} templates → ${path.basename(outPath)}`
);
