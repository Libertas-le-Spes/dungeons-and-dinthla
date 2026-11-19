import { addLink, type LinkActions } from "../../views/lists/linked-text";
import { textRunsOf, type MarkedPiece } from "../../views/lists/text-parts";
import { withoutEscapes } from "../imported/reading/shown-text";

export const NO_LEFT_PLAY = "Nothing is written in their note yet about how they left play.";

interface LineShape {
  readonly start: string;
  lineIn(section: HTMLElement): HTMLElement;
}

class SnapshotHeading implements LineShape {
  readonly start = "## ";

  lineIn(section: HTMLElement): HTMLElement {
    return section.createEl("h2", { cls: "dd-left-play-heading" });
  }
}

class ListHeading implements LineShape {
  readonly start = "### ";

  lineIn(section: HTMLElement): HTMLElement {
    return section.createEl("h3", { cls: "dd-left-play-list" });
  }
}

class ListEntry implements LineShape {
  readonly start = "- ";

  lineIn(section: HTMLElement): HTMLElement {
    return section.createEl("p", { cls: "dd-left-play-entry" });
  }
}

class PlainLine implements LineShape {
  readonly start = "";

  lineIn(section: HTMLElement): HTMLElement {
    return section.createEl("p", { cls: "dd-left-play-line" });
  }
}

const LINE_SHAPES: readonly LineShape[] = [new SnapshotHeading(), new ListHeading(), new ListEntry()];

const PLAIN_LINE = new PlainLine();

function shapeOf(line: string): LineShape {
  for (const shape of LINE_SHAPES) {
    if (line.startsWith(shape.start)) return shape;
  }
  return PLAIN_LINE;
}

function shownTextOf(pieces: readonly MarkedPiece[]): string {
  let text = "";
  for (const piece of pieces) text += piece.text;
  return withoutEscapes(text);
}

interface LineTarget {
  readonly sourcePath: string;
  readonly actions: LinkActions;
}

function addWords(parent: HTMLElement, words: string, target: LineTarget): void {
  for (const run of textRunsOf(words, [])) {
    const shown = shownTextOf(run.pieces);
    if (run.linktext === null) parent.appendText(shown);
    else addLink(parent, run.linktext, target.sourcePath, target.actions).appendText(shown);
  }
}

export function addLeftPlaySection(parent: HTMLElement, lines: readonly string[], target: LineTarget): void {
  const section = parent.createEl("section", { cls: "dd-left-play" });
  if (lines.length === 0) {
    section.createEl("p", { cls: "dd-empty", text: NO_LEFT_PLAY });
    return;
  }
  for (const line of lines) {
    const shape = shapeOf(line);
    addWords(shape.lineIn(section), line.substring(shape.start.length), target);
  }
}
