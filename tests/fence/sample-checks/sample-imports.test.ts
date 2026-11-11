import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { VIRTUAL_FOLDER } from "../scan/reading/scan-paths";

const SAMPLES_FOLDER = fileURLToPath(new URL("../samples", import.meta.url));
const SOURCE_IMPORT = /(?:\.\.\/)+src\/[A-Za-z0-9/._-]+/g;
const SAMPLE_FOLDER = `${VIRTUAL_FOLDER}/family`;

function sampleFiles(): string[] {
  return readdirSync(SAMPLES_FOLDER).filter((name) => name.endsWith(".ts"));
}

function importsIn(file: string): string[] {
  const text = readFileSync(`${SAMPLES_FOLDER}/${file}`, "utf8");
  return [...text.matchAll(SOURCE_IMPORT)].map(([imported]) => imported);
}

function missingFrom(file: string): string[] {
  return importsIn(file).filter((imported) => !existsSync(`${resolve(SAMPLE_FOLDER, imported)}.ts`));
}

describe("the sample code the fence tests scan", () => {
  it.each(sampleFiles())("imports only files that are there, in %s", (file) => {
    expect(missingFrom(file)).toEqual([]);
  });

  it("reads an import out of every sample file that names one", () => {
    const named = sampleFiles().filter((file) => readFileSync(`${SAMPLES_FOLDER}/${file}`, "utf8").includes("/src/"));
    expect(named.length).toBeGreaterThan(0);
    for (const file of named) expect(importsIn(file).length, file).toBeGreaterThan(0);
  });
});
