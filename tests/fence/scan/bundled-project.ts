import { PLUGIN_BUNDLE } from "../../../scripts/bundle-options.ts";
import { VIRTUAL_FOLDER } from "./scan-paths";

export const BUNDLED_PROJECT = `${VIRTUAL_FOLDER}/bundled/tsconfig.json`;

export function entryProject(rootFromProject: string, entry: string): string {
  return JSON.stringify({ extends: `${rootFromProject}/tsconfig.json`, compilerOptions: { allowJs: true }, files: [entry], include: [] });
}

function bundleEntry(): string {
  const entries = PLUGIN_BUNDLE.entryPoints;
  if (!Array.isArray(entries) || entries.length !== 1) throw new Error("The plugin bundle needs exactly one entry point.");
  const [entry] = entries;
  if (typeof entry !== "string") throw new Error("The plugin bundle's entry point needs to be a path.");
  return entry;
}

export function bundledProjectFiles(): Map<string, string> {
  return new Map([[BUNDLED_PROJECT, entryProject("../../../..", `../../../../${bundleEntry()}`)]]);
}
