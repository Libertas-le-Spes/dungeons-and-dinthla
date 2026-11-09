import { readFileSync } from "node:fs";
import { networkCodeIn } from "./network-code.ts";
import { styleNetworkCodeIn } from "./style-network-code.ts";

interface ReleaseFile {
  path: string;
  networkCodeIn: (text: string) => string[];
}

const RELEASE_FILES: ReleaseFile[] = [
  { path: "main.js", networkCodeIn },
  { path: "styles.css", networkCodeIn: styleNetworkCodeIn },
];

function checked(file: ReleaseFile): string[] {
  const found = file.networkCodeIn(readFileSync(file.path, "utf8"));
  for (const name of found) console.error(`${file.path} holds network code: ${name}`);
  if (found.length === 0) console.log(`${file.path} holds no network code.`);
  return found;
}

const found = RELEASE_FILES.flatMap(checked);

if (found.length > 0) process.exit(1);
