import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { gitIn, isAllowedInVault, pluginSettings, releaseFiles, trackedDemoFiles, VAULT_FOLDER, type VaultFile } from "./starter-vault/vault-files.ts";
import { ZipWriter } from "./starter-vault/zip-writer.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const USAGE = "Usage: node scripts/starter-vault.ts <folder with the release's main.js, manifest.json and styles.css> <zip to write>";

function byPath(first: VaultFile, second: VaultFile): number {
  return first.path.localeCompare(second.path);
}

const [, , releaseFolder, zipPath] = process.argv;
if (releaseFolder === undefined || zipPath === undefined) {
  console.error(USAGE);
  process.exit(1);
}

const files: VaultFile[] = [...trackedDemoFiles(gitIn(ROOT), "HEAD"), ...releaseFiles(releaseFolder), pluginSettings()];
const refused: string[] = [];
for (const file of files) {
  if (!isAllowedInVault(file.path)) refused.push(file.path);
}
if (refused.length > 0) {
  console.error(`The starter vault would hold files it may not:\n${refused.join("\n")}`);
  process.exit(1);
}

const zip = new ZipWriter();
for (const file of [...files].sort(byPath)) zip.add(`${VAULT_FOLDER}/${file.path}`, file.bytes);
writeFileSync(zipPath, zip.bytes());
console.log(`Wrote ${zipPath} with ${files.length} files.`);
