import { existsSync, realpathSync } from "node:fs";
import { ROOT, SOURCE_FOLDER } from "./scan-paths";

const OBSIDIAN_FOLDER = "obsidian/";
const CODE_MIRROR_FOLDER = "@codemirror/";
const NESTED_LIBRARY_FOLDER = "/node_modules/";
const PICTURE_CSS_SOURCE = `${SOURCE_FOLDER}campaign/background/picture-css.ts`;

export interface Disk {
  exists(path: string): boolean;
  realpath(path: string): string;
}

const REAL_DISK: Disk = { exists: existsSync, realpath: realpathSync };

function lies(inside: string, outside: string): boolean {
  return inside.startsWith(`${outside}/`);
}

function refuseOverlap(realRoot: string, real: string): void {
  const overlaps = real === realRoot || lies(real, realRoot) || lies(realRoot, real);
  if (overlaps) throw new Error(`${real} is where node_modules points, but it is the project ${realRoot} or lies inside or around it, so the scan can't tell libraries from the project's code.`);
}

export function libraryRootsOf(projectRoot: string, disk: Disk = REAL_DISK): string[] {
  const folder = `${projectRoot}/node_modules`;
  const roots = [`${folder}/`];
  if (!disk.exists(folder)) return roots;
  const realRoot = disk.realpath(projectRoot);
  const real = disk.realpath(folder);
  if (real !== `${realRoot}/node_modules`) refuseOverlap(realRoot, real);
  if (!roots.includes(`${real}/`)) roots.push(`${real}/`);
  return roots;
}

export function isUnderOneOf(roots: string[], path: string): boolean {
  return roots.some((root) => path.startsWith(root));
}

function insideLibrary(roots: string[], path: string, folder: string): boolean {
  const root = roots.find((candidate) => path.startsWith(candidate));
  if (root === undefined) return false;
  if (path.startsWith(`${root}${folder}`)) return true;
  return path.indexOf(`${NESTED_LIBRARY_FOLDER}${folder}`, root.length) !== -1;
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
