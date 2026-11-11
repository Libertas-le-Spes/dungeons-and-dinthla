import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("../../../..", import.meta.url)).replace(/\/$/, "");
export const SOURCE_FOLDER = `${ROOT}/src/`;
export const VIRTUAL_FOLDER = `${ROOT}/tests/fence/scanned`;

export function sourcePath(file: string): string {
  return `${SOURCE_FOLDER}${file}`;
}
