import type { NoteLines } from "./note-lines";
import { sectionTextOf, type SectionSource } from "./section-lines";
import { withoutComments } from "./without-comments";

const MATHS = ".math";
const PLAIN_LINES = "dd-plain-lines";

function showItsOwnText(maths: HTMLElement): void {
  const text = withoutComments(maths.getText());
  maths.className = PLAIN_LINES;
  maths.setText(text);
}

export function showDollarsPlain(root: HTMLElement, source: SectionSource, noteLines: NoteLines): void {
  const maths = Array.from(root.querySelectorAll<HTMLElement>(MATHS));
  if (maths.length === 0) return;
  const text = sectionTextOf(root, source, noteLines);
  if (text === null) {
    for (const one of maths) showItsOwnText(one);
    return;
  }
  root.empty();
  root.createEl("p", { cls: PLAIN_LINES, text });
}
