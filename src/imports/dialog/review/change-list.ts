import { IMPORTED_FROM_PROPERTY, IMPORTED_SESSION_PROPERTY } from "../../layout/import-properties";
import { changesNothing, type ImportChanges, type PropertyChange, type SectionChange, type TypedText } from "../../note/changes/import-changes";
import { NOTHING_CHANGES, typedTextWords } from "../import-words";
import { drawFold } from "./fold";

const NO_VALUE = "nothing";
const ARROW = " → ";
const REMOVED = "− ";
const ADDED = "+ ";
const UNSHOWN_PROPERTIES: readonly string[] = [IMPORTED_FROM_PROPERTY, IMPORTED_SESSION_PROPERTY];

function valueWords(value: string | null): string {
  if (value === null) return NO_VALUE;
  return value;
}

function propertyWords(change: PropertyChange): string {
  return `${change.name}: ${valueWords(change.before)}${ARROW}${valueWords(change.after)}`;
}

function isShown(change: PropertyChange): boolean {
  return !UNSHOWN_PROPERTIES.includes(change.name);
}

function propertiesWords(count: number): string {
  if (count === 1) return "1 property";
  return `${count} properties`;
}

function changeWords(properties: readonly PropertyChange[], sections: readonly SectionChange[]): string {
  const parts = sections.map((change) => change.title);
  if (properties.length > 0) parts.push(propertiesWords(properties.length));
  return `Changes: ${parts.join(", ")}.`;
}

function drawProperties(parent: HTMLElement, changes: readonly PropertyChange[]): void {
  if (changes.length === 0) return;
  const list = drawFold(parent, `Properties (${changes.length})`).createEl("ul", { cls: "dd-import-properties" });
  for (const change of changes) list.createEl("li", { text: propertyWords(change) });
}

function drawSection(parent: HTMLElement, change: SectionChange): void {
  const list = drawFold(parent, `${change.title} (${REMOVED}${change.removed.length} ${ADDED}${change.added.length})`).createEl("ul", { cls: "dd-import-lines" });
  for (const line of change.removed) list.createEl("li", { cls: "dd-import-removed", text: `${REMOVED}${line}` });
  for (const line of change.added) list.createEl("li", { cls: "dd-import-added", text: `${ADDED}${line}` });
}

function drawTyped(parent: HTMLElement, typed: readonly TypedText[]): void {
  if (typed.length === 0) return;
  const warning = parent.createDiv({ cls: "dd-import-warning", attr: { role: "alert" } });
  warning.createEl("p", { text: typedTextWords(typed.map((text) => text.title)) });
  for (const text of typed) {
    const list = drawFold(warning, `${text.title} (${text.lines.length})`).createEl("ul", { cls: "dd-import-lines" });
    for (const line of text.lines) list.createEl("li", { text: line });
  }
}

export function drawChanges(parent: HTMLElement, changes: ImportChanges): void {
  if (changesNothing(changes)) {
    parent.createEl("p", { cls: "dd-import-nothing", text: NOTHING_CHANGES });
    return;
  }
  const properties = changes.properties.filter(isShown);
  drawTyped(parent, changes.typed);
  if (properties.length + changes.sections.length > 0) parent.createEl("p", { cls: "dd-import-changes-line", text: changeWords(properties, changes.sections) });
  drawProperties(parent, properties);
  for (const section of changes.sections) drawSection(parent, section);
}
