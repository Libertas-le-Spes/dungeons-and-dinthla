import { characterCountOf } from "../../shape/character-count";
import { LINE_LENGTH } from "../../shape/import-limits";
import { cleanTextOf, NEW_LINE } from "../../text/clean-text";
import { NeutralText } from "../../text/neutral-text";

const MOST_NAMES_LISTED = 5;
const TOO_LONG = "The working is too long to show.";

function onOneLine(text: string): string {
  return cleanTextOf(text).split(NEW_LINE).join(" ");
}

export function neutralWorking(text: string): string {
  const written = NeutralText.ofLines(onOneLine(text)).written;
  if (characterCountOf(written) > LINE_LENGTH.most) return TOO_LONG;
  return written;
}

function firstNames(names: readonly string[]): string[] {
  const shown: string[] = [];
  for (const name of names) {
    if (shown.length < MOST_NAMES_LISTED) shown.push(name);
  }
  return shown;
}

export function shortList(names: readonly string[]): string {
  const shown = firstNames(names);
  const more = names.length - shown.length;
  if (more === 0) return shown.join(", ");
  return `${shown.join(", ")} and ${more} more`;
}

export function sumWorking(terms: readonly string[], total: number): string {
  return `${terms.join(" + ")} = ${total}`;
}

export function reasonedWorking(terms: readonly string[], total: number, reason: string): string {
  return `${sumWorking(terms, total)}, ${reason}`;
}

export function withConditional(working: string, conditional: readonly string[]): string {
  if (conditional.length === 0) return working;
  return `${working}. Plus conditional bonuses I don't apply: ${shortList(conditional)}`;
}
