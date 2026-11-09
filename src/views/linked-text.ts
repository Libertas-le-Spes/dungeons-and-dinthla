import { Keymap, type PaneType } from "obsidian";
import type { Source } from "../campaign/campaign";
import { textRunsOf, type MarkedPiece } from "./text-parts";

const MIDDLE_BUTTON = 1;

const ACTIVATING_KEYS = ["Enter", " "];

export interface LinkActions {
  openRow(source: Source): void;
  openLink(linktext: string, sourcePath: string, newLeaf: PaneType | boolean): void;
}

function addPieces(parent: HTMLElement, pieces: MarkedPiece[]): void {
  for (const piece of pieces) {
    if (piece.marked) parent.createEl("mark", { text: piece.text });
    else parent.appendText(piece.text);
  }
}

export function addNameLink(
  parent: HTMLElement,
  text: string,
  linktext: string,
  sourcePath: string,
  actions: LinkActions,
): HTMLElement {
  const name = parent.createEl("a", { cls: "dd-link-name", text, attr: { role: "link", tabindex: "0", draggable: "false" } });
  const follow = (event: MouseEvent | KeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();
    actions.openLink(linktext, sourcePath, Keymap.isModEvent(event));
  };
  name.addEventListener("click", follow);
  name.addEventListener("auxclick", (event) => {
    if (event.button === MIDDLE_BUTTON) follow(event);
  });
  name.addEventListener("keydown", (event) => {
    if (ACTIVATING_KEYS.includes(event.key)) follow(event);
  });
  name.addEventListener("dragstart", (event) => event.preventDefault());
  return name;
}

function addLink(parent: HTMLElement, linktext: string, sourcePath: string, actions: LinkActions): HTMLElement {
  const link = parent.createSpan({ cls: "dd-link" });
  link.createSpan({ cls: "dd-link-bracket", text: "[[" });
  const name = addNameLink(link, "", linktext, sourcePath, actions);
  link.createSpan({ cls: "dd-link-bracket", text: "]]" });
  return name;
}

export function addLinkedText(
  parent: HTMLElement,
  text: string,
  keywords: string[],
  sourcePath: string,
  actions: LinkActions,
): void {
  for (const run of textRunsOf(text, keywords)) {
    if (run.linktext === null) addPieces(parent, run.pieces);
    else addPieces(addLink(parent, run.linktext, sourcePath, actions), run.pieces);
  }
}

export function addRowButton(list: HTMLElement, source: Source, actions: LinkActions): HTMLElement {
  const row = list.createEl("li").createDiv({
    cls: "dd-row",
    attr: { role: "button", tabindex: "0", "data-path": source.path, "data-line": String(source.line) },
  });
  row.addEventListener("click", () => actions.openRow(source));
  row.addEventListener("keydown", (event) => {
    if (event.target !== row) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    actions.openRow(source);
  });
  return row;
}
