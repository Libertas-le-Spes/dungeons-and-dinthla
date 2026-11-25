import { Mark, PlainText, Span } from "../../elements/kinds/containers";
import type { ViewElement } from "../../elements/view-element";
import { textRunsOf, type MarkedPiece } from "./text-parts";
import { LinkName, type LinkOpener } from "./link-name";

function pieceOf(piece: MarkedPiece): ViewElement {
  if (piece.marked) return new Mark({ text: piece.text });
  return new PlainText(piece.text);
}

export class LinkedText {
  constructor(
    private readonly keywords: string[],
    private readonly sourcePath: string,
    private readonly opener: LinkOpener,
  ) {}

  build(text: string): ViewElement[] {
    const built: ViewElement[] = [];
    for (const run of textRunsOf(text, this.keywords)) {
      const pieces = run.pieces.map(pieceOf);
      if (run.linktext === null) built.push(...pieces);
      else built.push(this.linkOf(run.linktext, pieces));
    }
    return built;
  }

  private linkOf(linktext: string, pieces: readonly ViewElement[]): ViewElement {
    const name = new LinkName(linktext, this.sourcePath, this.opener).around(pieces);
    return new Span({ cls: ["dd-link"] }, [new Span({ cls: ["dd-link-bracket"], text: "[[" }), name, new Span({ cls: ["dd-link-bracket"], text: "]]" })]);
  }
}
