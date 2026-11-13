import { withEscapedCharacters } from "../../../imports/layout/character-escapes";
import { isImporterWritten } from "./importer-written";

const BARE_LINK = /^\[\[([^\]\r\n]+)\]\]$/;
const LINK_TARGET = "$1";

function isBareLink(written: string): boolean {
  if (BARE_LINK.test(written) === false) return false;
  const target = written.replace(BARE_LINK, LINK_TARGET);
  return withEscapedCharacters(target) === target;
}

export function isInertWritten(written: string): boolean {
  if (isImporterWritten(written)) return true;
  return isBareLink(written);
}
