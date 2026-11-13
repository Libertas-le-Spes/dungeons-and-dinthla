import { NeutralText } from "../../../beyond/text/neutral-text";

const LINE_BREAK = "\n";

export function neutralLineOf(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  const written = NeutralText.ofLines(trimmed).written;
  if (written.includes(LINE_BREAK)) return null;
  return written;
}
