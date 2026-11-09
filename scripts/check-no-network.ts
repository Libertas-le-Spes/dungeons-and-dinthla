import { readFileSync } from "node:fs";
import { networkCodeIn } from "./network-code.ts";

const bundlePath = process.argv[2];

if (bundlePath === undefined) {
  console.error("Name the built bundle to check, such as main.js.");
  process.exit(1);
}

const found = networkCodeIn(readFileSync(bundlePath, "utf8"));

for (const name of found) console.error(`${bundlePath} holds network code: ${name}`);

if (found.length > 0) process.exit(1);

console.log(`${bundlePath} holds no network code.`);
