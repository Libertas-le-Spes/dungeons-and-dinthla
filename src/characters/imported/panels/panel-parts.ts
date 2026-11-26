import { Div, Heading2, ListItem, Paragraph, Section, Span } from "../../../views/elements/kinds/containers";
import type { ViewElement } from "../../../views/elements/view-element";
import type { SectionEntries } from "../lists/section-entries";
import { leftOutWordsOf } from "../lists/left-out-words";

export const NOTHING_CAME_IN = "Nothing came in for this list.";

export function panelSection(title: string, count: number, inside: readonly ViewElement[]): ViewElement {
  const heading = new Heading2({ cls: ["dd-title"], text: title }, [new Span({ cls: ["dd-count"], text: String(count) })]);
  return new Section({ cls: ["dd-sheet-panel"] }, [new Div({ cls: ["dd-head"] }, [heading]), ...inside]);
}

export function nothingCameIn(listed: SectionEntries): ViewElement[] {
  if (listed.entries.length > 0) return [];
  return [new Paragraph({ cls: ["dd-empty"], text: NOTHING_CAME_IN })];
}

export function leftOut(listed: SectionEntries): ViewElement[] {
  if (listed.leftOut === null) return [];
  const words = leftOutWordsOf(listed.leftOut);
  if (words === null) return [];
  return [new Paragraph({ cls: ["dd-note", "dd-left-out"], text: words })];
}

export function panelLine(text: string, after: readonly ViewElement[]): ViewElement {
  return new ListItem({ cls: ["dd-panel-line"] }, [new Span({ cls: ["dd-text"], text }), ...after]);
}
