import { refusalForFileName } from "../../names/file-name";

const NOT_IN_A_FILE_NAME = /[\\/:*?"<>|#^[\]]/g;
const SAFE_CHARACTER = "-";

export const NO_NAME = "it has no name.";

export function itemFileNameOf(itemName: string): string {
  return itemName.replace(NOT_IN_A_FILE_NAME, SAFE_CHARACTER);
}

export function refusalForItemNote(itemName: string): string | null {
  const fileName = itemFileNameOf(itemName);
  if (fileName.trim() === "") return NO_NAME;
  return refusalForFileName(fileName);
}
