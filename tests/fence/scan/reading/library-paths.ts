import { ROOT, SOURCE_FOLDER } from "./scan-paths";

const LIBRARY_FOLDER = `${ROOT}/node_modules/`;
const OBSIDIAN_FOLDER = `${LIBRARY_FOLDER}obsidian/`;
const CODE_MIRROR_FOLDER = `${LIBRARY_FOLDER}@codemirror/`;
const PICTURE_CSS_SOURCE = `${SOURCE_FOLDER}campaign/background/picture-css.ts`;

export function isInLibraryFolder(path: string): boolean {
  return path.startsWith(LIBRARY_FOLDER);
}

export function isInObsidianFolder(path: string): boolean {
  return path.startsWith(OBSIDIAN_FOLDER);
}

export function isInCodeMirrorFolder(path: string): boolean {
  return path.startsWith(CODE_MIRROR_FOLDER);
}

export function isPictureCssSource(path: string): boolean {
  return path === PICTURE_CSS_SOURCE;
}
