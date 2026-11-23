import { isInGateFolder } from "./gate-paths";
import { SOURCE_FOLDER } from "./scan-paths";

const ADAPTER_FOLDER = `${SOURCE_FOLDER}obsidian/`;
const MAIN_FILE = `${SOURCE_FOLDER}main.ts`;

export function isCoreSource(path: string): boolean {
  if (path === MAIN_FILE || isInGateFolder(path)) return false;
  return !path.startsWith(ADAPTER_FOLDER);
}
