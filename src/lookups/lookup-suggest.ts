import { EditorSuggest, type App, type Editor, type EditorPosition, type EditorSuggestContext, type EditorSuggestTriggerInfo, type TFile } from "obsidian";
import type { Campaign } from "../campaign/campaign";
import { firstLineAfterProperties } from "../campaign/session-file";
import { lookupMatches, readLookup, type LookupMatch } from "./lookup";
import { addLookupMatch } from "./lookup-match-row";

export class LookupSuggest extends EditorSuggest<LookupMatch> {
  constructor(
    app: App,
    private readonly campaignAsEdited: (path: string, text: string) => Campaign,
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
    return lookupMatches(this.campaignAsEdited(context.file.path, context.editor.getValue()), lookup);
  }

  renderSuggestion(match: LookupMatch, el: HTMLElement): void {
    addLookupMatch(el, match, this.keywords());
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
