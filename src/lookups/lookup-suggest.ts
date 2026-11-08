import { EditorSuggest, type App, type Editor, type EditorPosition, type EditorSuggestContext, type EditorSuggestTriggerInfo, type TFile } from "obsidian";
import type { Campaign } from "../campaign/campaign";
import { textRunsOf } from "../views/text-parts";
import { firstLineAfterProperties } from "../campaign/session-file";
import { THE_PARTY_LABEL } from "../funds/item-groups";
import { lookupMatches, readLookup, type LookupKind, type LookupMatch } from "./lookup";

const MARKERS: Record<LookupKind, { text: string; cls: string }> = {
  question: { text: "?", cls: "dd-marker dd-marker-question" },
  quest: { text: "!", cls: "dd-marker dd-marker-quest" },
  item: { text: "$", cls: "dd-marker dd-marker-ledger" },
};

export class LookupSuggest extends EditorSuggest<LookupMatch> {
  constructor(
    app: App,
    private readonly campaign: () => Campaign,
    private readonly inSession: (path: string) => boolean,
    private readonly pick: (match: LookupMatch, context: EditorSuggestContext) => void,
  ) {
    super(app);
  }

  onTrigger(cursor: EditorPosition, editor: Editor, file: TFile | null): EditorSuggestTriggerInfo | null {
    const line = editor.getLine(cursor.line);
    if (readLookup(line) === null || file === null || !this.inSession(file.path)) return null;
    if (cursor.line < firstLineAfterProperties(editor.getValue())) return null;
    return { start: { line: cursor.line, ch: 0 }, end: { line: cursor.line, ch: line.length }, query: line };
  }

  getSuggestions(context: EditorSuggestContext): LookupMatch[] {
    const lookup = readLookup(context.query);
    if (lookup === null) return [];
    return lookupMatches(this.campaign(), lookup);
  }

  renderSuggestion(match: LookupMatch, el: HTMLElement): void {
    el.addClass("dd-tokens", "dd-lookup");
    const marker = MARKERS[match.kind];
    el.createSpan({ cls: marker.cls, text: marker.text });
    const text = el.createSpan({ cls: "dd-lookup-text" });
    for (const run of textRunsOf(match.text, this.keywords())) {
      for (const piece of run.pieces) {
        if (piece.marked) text.createEl("mark", { text: piece.text });
        else text.appendText(piece.text);
      }
    }
    if (match.kind === "item") {
      let holder = THE_PARTY_LABEL;
      if (match.holder !== "") holder = match.holder;
      el.createSpan({ cls: "dd-lookup-holder", text: holder });
    }
  }

  private keywords(): string[] {
    const context = this.context;
    if (context === null) return [];
    const lookup = readLookup(context.query);
    if (lookup === null) return [];
    return lookup.keywords;
  }

  selectSuggestion(match: LookupMatch): void {
    const context = this.context;
    this.close();
    if (context === null) return;
    this.pick(match, context);
  }
}
