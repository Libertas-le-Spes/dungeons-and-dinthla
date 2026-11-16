import { sectionTextOf, type SectionSource } from "./section-lines";

export const BEFORE_OBSIDIANS_MATHS = -100;

const MATHS = ".math";
const PLAIN_LINES = "dd-plain-lines";

function showItsOwnText(maths: Element): void {
  maths.className = PLAIN_LINES;
}

export function showDollarsPlain(root: HTMLElement, source: SectionSource): void {
  const maths = Array.from(root.querySelectorAll(MATHS));
  if (maths.length === 0) return;
  const text = sectionTextOf(root, source);
  if (text === null) {
    for (const one of maths) showItsOwnText(one);
    return;
  }
  root.empty();
  root.createEl("p", { cls: PLAIN_LINES, text });
}
