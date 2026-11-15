import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "../..");

function filesUnder({ folder, extension }: { folder: string; extension: string }): string[] {
  return readdirSync(join(ROOT, folder), { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
    .map((entry) => relative(ROOT, join(entry.parentPath, entry.name)));
}

export function styleFiles(): string[] {
  return filesUnder({ folder: "styles", extension: ".css" });
}

export function sourceFiles(): string[] {
  return filesUnder({ folder: "src", extension: ".ts" });
}

export function textOf(file: string): string {
  return readFileSync(join(ROOT, file), "utf8");
}
