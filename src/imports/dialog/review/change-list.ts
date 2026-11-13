import { changesNothing, type ImportChanges, type PropertyChange, type SectionChange, type TypedText } from "../../note/changes/import-changes";
import { NOTHING_CHANGES, TYPED_TEXT_WARNING } from "../import-words";

const NO_VALUE = "nothing";
const ARROW = " → ";
const REMOVED = "− ";
const ADDED = "+ ";

function valueWords(value: string | null): string {
  if (value === null) return NO_VALUE;
  return value;
}

function propertyWords(change: PropertyChange): string {
  return `${change.name}: ${valueWords(change.before)}${ARROW}${valueWords(change.after)}`;
}

function drawProperties(parent: HTMLElement, changes: readonly PropertyChange[]): void {
  if (changes.length === 0) return;
  const list = parent.createEl("ul", { cls: "dd-import-properties" });
  for (const change of changes) list.createEl("li", { text: propertyWords(change) });
}

function drawSection(parent: HTMLElement, change: SectionChange): void {
  parent.createEl("p", { cls: "dd-import-heading", text: change.heading });
  const list = parent.createEl("ul", { cls: "dd-import-lines" });
  for (const line of change.removed) list.createEl("li", { cls: "dd-import-removed", text: `${REMOVED}${line}` });
  for (const line of change.added) list.createEl("li", { cls: "dd-import-added", text: `${ADDED}${line}` });
}

function drawTyped(parent: HTMLElement, typed: readonly TypedText[]): void {
  if (typed.length === 0) return;
  const warning = parent.createDiv({ cls: "dd-import-warning", attr: { role: "alert" } });
  warning.createEl("p", { text: TYPED_TEXT_WARNING });
  for (const text of typed) {
    warning.createEl("p", { cls: "dd-import-heading", text: text.heading });
    const list = warning.createEl("ul", { cls: "dd-import-lines" });
    for (const line of text.lines) list.createEl("li", { text: line });
  }
}

export function drawChanges(parent: HTMLElement, changes: ImportChanges): void {
  if (changesNothing(changes)) {
    parent.createEl("p", { cls: "dd-import-nothing", text: NOTHING_CHANGES });
    return;
  }
  drawTyped(parent, changes.typed);
  drawProperties(parent, changes.properties);
  for (const section of changes.sections) drawSection(parent, section);
}
