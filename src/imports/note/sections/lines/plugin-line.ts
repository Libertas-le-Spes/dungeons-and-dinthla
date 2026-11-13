import { NeutralText } from "../../../../beyond/text/neutral-text";
import { LINE_START, PART_SEPARATOR } from "../../../layout/section-line-format";

export function neutralPartOf(text: string): string {
  return NeutralText.ofLines(text).written;
}

export function pluginLineOf(parts: readonly string[], separator: string = PART_SEPARATOR): string {
  return `${LINE_START}${parts.join(separator)}`;
}
