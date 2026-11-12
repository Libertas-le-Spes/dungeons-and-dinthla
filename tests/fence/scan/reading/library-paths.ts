import { existsSync, realpathSync } from "node:fs";
import { ROOT, SOURCE_FOLDER } from "./scan-paths";

const OBSIDIAN_FOLDER = "obsidian/";
const CODE_MIRROR_FOLDER = "@codemirror/";
const NESTED_LIBRARY_FOLDER = "/node_modules/";
const PICTURE_CSS_SOURCE = `${SOURCE_FOLDER}campaign/background/picture-css.ts`;

export function libraryRootsOf(projectRoot: string): string[] {
  const folder = `${projectRoot}/node_modules`;
  const roots = [`${folder}/`];
  if (!existsSync(folder)) return roots;
  const real = `${realpathSync(folder)}/`;
  if (!roots.includes(real)) roots.push(real);
  return roots;
}

export function isUnderOneOf(roots: string[], path: string): boolean {
  return roots.some((root) => path.startsWith(root));
}

function insideLibrary(roots: string[], path: string, folder: string): boolean {
  const root = roots.find((candidate) => path.startsWith(candidate));
  if (root === undefined) return false;
  const inside = path.substring(root.length);
  return inside.startsWith(folder) || inside.includes(`${NESTED_LIBRARY_FOLDER}${folder}`);
}

const LIBRARY_ROOTS = libraryRootsOf(ROOT);

export function isInLibraryFolder(path: string): boolean {
  return isUnderOneOf(LIBRARY_ROOTS, path);
}

export function isInObsidianFolder(path: string): boolean {
  return insideLibrary(LIBRARY_ROOTS, path, OBSIDIAN_FOLDER);
}

export function isInCodeMirrorFolder(path: string): boolean {
  return insideLibrary(LIBRARY_ROOTS, path, CODE_MIRROR_FOLDER);
}

export function isPictureCssSource(path: string): boolean {
  return path === PICTURE_CSS_SOURCE;
}
