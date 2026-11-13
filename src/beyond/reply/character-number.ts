import type { JsonReader } from "./json/json-reader";
import { noCharacterNumber } from "./common/reply-refusals";

export function characterNumberOf(data: JsonReader): number {
  const found = data.numberAt("id");
  if (found === null) throw noCharacterNumber();
  if (!Number.isSafeInteger(found)) throw noCharacterNumber();
  if (found < 1) throw noCharacterNumber();
  return found;
}
