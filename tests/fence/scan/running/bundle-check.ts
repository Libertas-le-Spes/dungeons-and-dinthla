import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { build, transform } from "esbuild";
import { PLUGIN_BUNDLE } from "../../../../scripts/bundle-options.ts";
import type { Allowances } from "../reading/allowances";
import { isUnderOneOf, libraryRootsOf } from "../reading/library-paths";
import type { SourceScanner } from "./source-scanner";

export const HIDDEN_CODE = [".js", ".mjs", ".cjs", ".mts", ".cts", ".tsx", ".jsx"];

export function hiddenCodeIn(listing: string[]): string[] {
  return listing.filter((path) => HIDDEN_CODE.some((ending) => path.endsWith(ending))).map((path) => `${path} is code under src that the scan can't read as TypeScript`);
}

export function isDeclaration(path: string): boolean {
  return path.endsWith(".d.ts");
}

function isPlainTypeScript(path: string): boolean {
  return path.endsWith(".ts") && !isDeclaration(path) && !HIDDEN_CODE.some((ending) => path.endsWith(ending));
}

function unscannableIn(loaded: string[]): string[] {
  return loaded.filter((path) => !isPlainTypeScript(path)).map((path) => `${path} is loaded from the entry point but isn't a plain TypeScript file`);
}

function isScanned(path: string): boolean {
  return !isDeclaration(path);
}

export function scannedFiles(loaded: string[]): string[] {
  return loaded.filter(isScanned);
}

export function unreadableCode(listing: string[], loaded: string[]): string[] {
  return [...hiddenCodeIn(listing), ...unscannableIn(loaded)];
}

export function fenceBreaches(scanner: SourceScanner, project: string, listing: string[], allowances: Allowances): string[] {
  const loaded = scanner.loadedFiles(project);
  return [...unreadableCode(listing, loaded), ...scanner.breaches(project, scannedFiles(loaded), allowances)];
}

async function bundledInputs(root: string): Promise<string[]> {
  const result = await build({ ...PLUGIN_BUNDLE, absWorkingDir: root, write: false, metafile: true, logLevel: "silent" });
  const libraryRoots = libraryRootsOf(root);
  const ownedByLibrary = (path: string) => isUnderOneOf(libraryRoots, path);
  return Object.keys(result.metafile.inputs)
    .map((input) => resolve(root, input))
    .filter((path) => !ownedByLibrary(path));
}

async function holdsCode(path: string): Promise<boolean> {
  const result = await transform(readFileSync(path, "utf8"), { loader: "ts" });
  return result.code !== "";
}

export async function unscannedBundleInputs(scanner: SourceScanner, root: string, project: string): Promise<string[]> {
  const bundled = await bundledInputs(root);
  const scanned = scanner.loadedFiles(project).filter((path) => !isDeclaration(path));
  const notScanned = bundled.filter((path) => !scanned.includes(path)).map((path) => `${path} is bundled but not scanned`);
  const notBundled = scanned.filter((path) => !bundled.includes(path));
  const holdingCode = await Promise.all(notBundled.map(holdsCode));
  const codeNotBundled = notBundled.filter((_path, index) => holdingCode[index]).map((path) => `${path} holds code but is scanned and not bundled`);
  return [...notScanned, ...codeNotBundled];
}
