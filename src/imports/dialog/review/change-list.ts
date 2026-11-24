import { IMPORTED_FROM_PROPERTY, IMPORTED_SESSION_PROPERTY } from "../../layout/import-properties";
import { changesNothing, type ImportChanges, type PropertyChange, type SectionChange, type TypedText } from "../../note/changes/import-changes";
import { IMPORT_MARKS_CHANGE, NOTHING_CHANGES, typedTextWords } from "../import-words";
import { foldOf } from "./fold";
import { Div, Heading3, List, ListItem, Paragraph } from "../../../views/elements/kinds/containers";
import type { ViewElement } from "../../../views/elements/view-element";

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
  if (parts.length === 0) return IMPORT_MARKS_CHANGE;
  return `Changes: ${parts.join(", ")}.`;
}

function propertiesTree(changes: readonly PropertyChange[]): ViewElement[] {
  if (changes.length === 0) return [];
  const items = changes.map((change) => new ListItem({ text: propertyWords(change) }));
  return [foldOf(`Properties (${changes.length})`, new List({ cls: ["dd-import-properties"] }, items))];
}

function sectionTree(change: SectionChange): ViewElement {
  const items: ViewElement[] = [];
  for (const line of change.removed) items.push(new ListItem({ cls: ["dd-import-removed"], text: `${REMOVED}${line}` }));
  for (const line of change.added) items.push(new ListItem({ cls: ["dd-import-added"], text: `${ADDED}${line}` }));
  return foldOf(`${change.title} (${REMOVED}${change.removed.length} ${ADDED}${change.added.length})`, new List({ cls: ["dd-import-lines"] }, items));
}

function typedTree(typed: readonly TypedText[]): ViewElement[] {
  if (typed.length === 0) return [];
  const inside: ViewElement[] = [new Paragraph({ text: typedTextWords(typed.map((text) => text.title)) })];
  for (const text of typed) {
    inside.push(new Heading3({ cls: ["dd-import-typed-title"], text: `${text.title} (${text.lines.length})` }));
    inside.push(new List({ cls: ["dd-import-lines"] }, text.lines.map((line) => new ListItem({ text: line }))));
  }
  return [new Div({ cls: ["dd-import-warning"], role: "alert" }, inside)];
}

export function changeTrees(changes: ImportChanges): ViewElement[] {
  if (changesNothing(changes)) return [new Paragraph({ cls: ["dd-import-nothing"], text: NOTHING_CHANGES })];
  const properties = changes.properties.filter(isShown);
  return [
    ...typedTree(changes.typed),
    new Paragraph({ cls: ["dd-import-changes-line"], text: changeWords(properties, changes.sections) }),
    ...propertiesTree(properties),
    ...changes.sections.map(sectionTree),
  ];
}
