import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SOURCE_FOLDER = fileURLToPath(new URL("../../src/", import.meta.url));
const GATEKEEPER_FOLDER = "fence/";

interface Forbidden {
  name: string;
  pattern: RegExp;
}

const FORBIDDEN: Forbidden[] = [
  { name: "app.vault", pattern: /app\.vault/ },
  { name: ".vault.", pattern: /\.vault\./ },
  { name: "vault.adapter", pattern: /vault\.adapter/ },
  { name: "fileManager", pattern: /fileManager/ },
  { name: "metadataCache", pattern: /metadataCache/ },
  { name: ".vault", pattern: /\.vault\b/ },
  { name: '["vault"]', pattern: /\[\s*["'`]vault["'`]\s*\]/ },
  { name: "{ vault } =", pattern: /\{[^}]*\bvault\b[^}]*\}\s*=/ },
  { name: ".adapter", pattern: /\.adapter\b/ },
];

function sourceFiles(): string[] {
  const all = readdirSync(SOURCE_FOLDER, { recursive: true, encoding: "utf8" });
  return all.filter((path) => path.endsWith(".ts")).map((path) => path.split("\\").join("/"));
}

function isOutsideGatekeeper(path: string): boolean {
  return !path.startsWith(GATEKEEPER_FOLDER);
}

function breachesIn(path: string): string[] {
  const text = readFileSync(join(SOURCE_FOLDER, path), "utf8");
  const found = FORBIDDEN.filter((forbidden) => forbidden.pattern.test(text));
  return found.map((forbidden) => `${path} uses ${forbidden.name}`);
}

describe("the vault fence", () => {
  it("reads the plugin's whole source, the entry point included", () => {
    const files = sourceFiles();
    expect(files).toContain("main.ts");
    expect(files).toContain("fence/gatekeeper.ts");
    expect(files.length).toBeGreaterThan(100);
  });

  it("lets only the gatekeeper's own folder reach the vault, its files or Obsidian's file metadata", () => {
    const breaches = sourceFiles().filter(isOutsideGatekeeper).flatMap(breachesIn);
    expect(breaches).toEqual([]);
  });

  it("would catch each way of reaching the vault", () => {
    const samples = [
      "this.app.vault.read(file)",
      "const files = app.vault;",
      "file.vault.process(file, change)",
      "vault.adapter.write(path, text)",
      "app.fileManager.trashFile(file)",
      "app.metadataCache.getCache(path)",
      "const raw = file.vault;",
      'app["vault"].read(file)',
      "const { vault } = app;",
      "plugin.adapter.read(path)",
    ];
    const caught = samples.filter((sample) => FORBIDDEN.some((forbidden) => forbidden.pattern.test(sample)));
    expect(caught).toEqual(samples);
  });
});
