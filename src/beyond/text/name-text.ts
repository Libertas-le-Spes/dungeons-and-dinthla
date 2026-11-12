import { NAME_LENGTH } from "../shape/import-limits";
import { emptyName } from "../shape/refusal";
import { limitedText } from "./limited-text";
import { NeutralText } from "./neutral-text";
import { plainTextOf } from "./plain-text";

export function nameTextOf(text: string): string {
  const written = NeutralText.ofOneLine(limitedText(plainTextOf(text), NAME_LENGTH)).written;
  if (written === "") throw emptyName();
  return written;
}
