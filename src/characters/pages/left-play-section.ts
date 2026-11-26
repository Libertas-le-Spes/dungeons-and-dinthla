import { textRunsOf, type MarkedPiece } from "../../views/components/rows/text-parts";
import { LinkName, type LinkOpener } from "../../views/components/rows/link-name";
import { bracketed } from "../../views/components/rows/linked-text";
import { Heading2, Heading3, Paragraph, PlainText, Section } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import { withoutEscapes } from "../imported/reading/shown-text";

export const NO_LEFT_PLAY = "Nothing is written in their note yet about how they left play.";

interface LineShape {
  readonly start: string;
  lineOf(words: readonly ViewElement[]): ViewElement;
}

class SnapshotHeading implements LineShape {
  readonly start = "## ";

  lineOf(words: readonly ViewElement[]): ViewElement {
    return new Heading2({ cls: ["dd-left-play-heading"] }, words);
  }
}

class ListHeading implements LineShape {
  readonly start = "### ";

  lineOf(words: readonly ViewElement[]): ViewElement {
    return new Heading3({ cls: ["dd-left-play-list"] }, words);
  }
}

class ListEntry implements LineShape {
  readonly start = "- ";

  lineOf(words: readonly ViewElement[]): ViewElement {
    return new Paragraph({ cls: ["dd-left-play-entry"] }, words);
  }
}

class PlainLine implements LineShape {
  readonly start = "";

  lineOf(words: readonly ViewElement[]): ViewElement {
    return new Paragraph({ cls: ["dd-left-play-line"] }, words);
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

export interface LineTarget {
  readonly sourcePath: string;
  readonly opener: LinkOpener;
}

function wordsOf(words: string, target: LineTarget): ViewElement[] {
  const shown: ViewElement[] = [];
  for (const run of textRunsOf(words, [])) {
    const text = shownTextOf(run.pieces);
    if (run.linktext === null) shown.push(new PlainText(text));
    else shown.push(bracketed(new LinkName(run.linktext, target.sourcePath, target.opener).around([new PlainText(text)])));
  }
  return shown;
}

export function leftPlaySection(lines: readonly string[], target: LineTarget): ViewElement {
  if (lines.length === 0) return new Section({ cls: ["dd-left-play"] }, [new Paragraph({ cls: ["dd-empty"], text: NO_LEFT_PLAY })]);
  const shown: ViewElement[] = [];
  for (const line of lines) {
    const shape = shapeOf(line);
    shown.push(shape.lineOf(wordsOf(line.substring(shape.start.length), target)));
  }
  return new Section({ cls: ["dd-left-play"] }, shown);
}
