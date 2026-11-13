import type { SectionEntries } from "../lists/section-entries";
import { leftOutWordsOf } from "../lists/left-out-words";

export const NOTHING_CAME_IN = "Nothing came in for this list.";

export function addPanelSection(root: HTMLElement, title: string, count: number): HTMLElement {
  const panel = root.createEl("section", { cls: "dd-sheet-panel" });
  const heading = panel.createDiv({ cls: "dd-head" }).createEl("h2", { cls: "dd-title", text: title });
  heading.createSpan({ cls: "dd-count", text: String(count) });
  return panel;
}

export function addNothingCameIn(panel: HTMLElement, listed: SectionEntries): void {
  if (listed.entries.length > 0) return;
  panel.createEl("p", { cls: "dd-empty", text: NOTHING_CAME_IN });
}

export function addLeftOut(panel: HTMLElement, listed: SectionEntries): void {
  if (listed.leftOut === null) return;
  const words = leftOutWordsOf(listed.leftOut);
  if (words === null) return;
  panel.createEl("p", { cls: "dd-note dd-left-out", text: words });
}

export function addPanelLine(list: HTMLElement, text: string): HTMLElement {
  const line = list.createEl("li", { cls: "dd-panel-line" });
  line.createSpan({ cls: "dd-text", text });
  return line;
}
