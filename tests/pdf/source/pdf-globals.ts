import { PLAIN_GLOBALS } from "../../fence/allowed/globals";

export const PDF_PLAIN_GLOBALS = ["DataView", "Uint8Array"];

export const PDF_FILE_GLOBALS: Record<string, string[]> = {
  "pdf/streams/inflate/platform-inflating.ts": ["Blob", "DecompressionStream"],
};

export function isPlainGlobal(name: string): boolean {
  return PLAIN_GLOBALS.includes(name);
}

export function isPdfPlainGlobal(name: string): boolean {
  return PDF_PLAIN_GLOBALS.includes(name);
}

function isAllowedInFile(path: string, name: string): boolean {
  for (const [file, names] of Object.entries(PDF_FILE_GLOBALS)) {
    if (path.endsWith(`/src/${file}`) && names.includes(name)) return true;
  }
  return false;
}

export function isPdfGlobalAllowed(path: string, name: string): boolean {
  return isPlainGlobal(name) || isPdfPlainGlobal(name) || isAllowedInFile(path, name);
}
