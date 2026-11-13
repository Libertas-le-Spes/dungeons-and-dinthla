import { withoutEscapes } from "../reading/shown-text";
import { isGuardedAsImported } from "./importer-written";

export function shownItemName(name: string): string {
  if (isGuardedAsImported(name)) return withoutEscapes(name);
  return name;
}
