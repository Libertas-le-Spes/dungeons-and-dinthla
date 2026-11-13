import { unlink } from "../../../notes/parts/link";
import { withoutEscapes } from "../reading/shown-text";

const SPACES = /\s+/g;

function keyOfShown(name: string): string {
  return name.replace(SPACES, " ").trim().toLowerCase();
}

export function itemKeyOf(written: string): string {
  return keyOfShown(withoutEscapes(written));
}

export function storedItemKeyOf(name: string): string {
  return keyOfShown(withoutEscapes(unlink(name)));
}
