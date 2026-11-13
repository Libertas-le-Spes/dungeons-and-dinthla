import { characterCountOf } from "../../shape/character-count";
import { LINE_LENGTH, NAME_LENGTH } from "../../shape/import-limits";
import type { CleanLine } from "../../text/clean-line";
import { cleanTextOf } from "../../text/clean-text";
import { TAG } from "../../text/plain-text";
import { lineOrNothing } from "./line-or-nothing";
import type { LineLoss } from "./line-loss";
import { splitLines } from "./split-lines";

function isTooLong(cleaned: string): boolean {
  if (characterCountOf(cleaned) > LINE_LENGTH.most) return true;
  return characterCountOf(cleaned.replace(TAG, "").trim()) > NAME_LENGTH.most;
}

export class LineTally {
  private readonly kept: CleanLine[] = [];
  private tooLong = 0;
  private notClean = 0;

  take(text: string): CleanLine | null {
    const cleaned = cleanTextOf(text);
    if (cleaned.trim() === "") return null;
    if (isTooLong(cleaned)) {
      this.tooLong += 1;
      return null;
    }
    const line = lineOrNothing(cleaned);
    if (line === null) {
      this.notClean += 1;
      return null;
    }
    this.kept.push(line);
    return line;
  }

  takeLinesOf(text: string): void {
    for (const line of splitLines(text)) this.take(line);
  }

  lines(): readonly CleanLine[] {
    return this.kept;
  }

  loss(): LineLoss {
    return { tooLong: this.tooLong, notClean: this.notClean };
  }
}
