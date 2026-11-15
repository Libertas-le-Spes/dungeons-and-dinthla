import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SOURCE_FOLDER = fileURLToPath(new URL("../../src", import.meta.url));
const MOST_FILES = 10;

const FOLDERS = ["beyond/reply/parts", "beyond/reply/details", "funds/purses", "imports/leaving/dialog", "imports/leaving/questions", "imports/leaving/choices", "characters/cards", "characters/pages"];

function fileCountIn(folder: string): number {
  return readdirSync(join(SOURCE_FOLDER, folder), { withFileTypes: true }).filter((entry) => entry.isFile()).length;
}

describe("the folders this work added to", () => {
  it.each(FOLDERS)("hold at most ten files: %s", (folder) => {
    expect(fileCountIn(folder)).toBeLessThanOrEqual(MOST_FILES);
  });
});
