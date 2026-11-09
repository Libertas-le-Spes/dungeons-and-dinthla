import { MarkdownView, type App, type Editor, type EditorSuggestContext, type TFile } from "obsidian";
import type { Source } from "../campaign/campaign";
import { PROPERTIES_WOULD_CHANGE } from "../campaign/note-editor";
import { keepsProperties } from "../campaign/session-file";
import type { FencedFiles } from "../fence/fenced-files";
import { removeLines } from "../notes/note-lines";
import type { LookupMatch } from "./lookup";
import { openMatch, type LookupOpeners } from "./open-match";

export type LookupFiles = Pick<FencedFiles, "process">;

export const NOT_IN_A_NOTE_VIEW = "Lookups work in a note opened in its own tab, so nothing was changed.";
export const NOTE_NOT_SHOWN = "The note is no longer open in that tab, so nothing was changed.";
export const LOOKUP_CHANGED = "The lookup line changed before it was picked, so nothing was changed.";

export function sourceAfterRemoving(source: Source, path: string, line: number): Source {
  if (source.path !== path || source.line < line) return source;
  return { path, line: source.line - 1 };
}

function viewOf(app: App, editor: Editor): MarkdownView | undefined {
  for (const leaf of app.workspace.getLeavesOfType("markdown")) {
    if (leaf.view instanceof MarkdownView && leaf.view.editor === editor) return leaf.view;
  }
  return undefined;
}

function isShowing(view: MarkdownView, editor: Editor, file: TFile): boolean {
  return view.editor === editor && view.file === file;
}

async function removeLookupLine(files: LookupFiles, view: MarkdownView, context: EditorSuggestContext): Promise<string> {
  const { editor, file } = context;
  const line = context.start.line;
  const lookupLine = editor.getLine(line);
  let refusal: string | null = null;
  const written = await files.process(file, (saved) => {
    if (!isShowing(view, editor, file)) {
      refusal = NOTE_NOT_SHOWN;
      return saved;
    }
    const typed = editor.getValue();
    const removal = removeLines(typed, [{ line, matches: (read) => read === lookupLine }]);
    if (removal.removed === 0) {
      refusal = LOOKUP_CHANGED;
      return saved;
    }
    if (!keepsProperties(typed, removal.text)) {
      refusal = PROPERTIES_WOULD_CHANGE;
      return saved;
    }
    return removal.text;
  });
  if (refusal !== null) throw new Error(refusal);
  return written;
}

export async function openLookup(
  app: App,
  files: LookupFiles,
  match: LookupMatch,
  context: EditorSuggestContext,
  noteChanged: (path: string, text: string) => void,
  openers: LookupOpeners,
): Promise<void> {
  const view = viewOf(app, context.editor);
  if (view === undefined) throw new Error(NOT_IN_A_NOTE_VIEW);
  const written = await removeLookupLine(files, view, context);
  noteChanged(context.file.path, written);
  const source = sourceAfterRemoving(match.source, context.file.path, context.start.line);
  const onClosed = () => context.editor.focus();
  openMatch(openers, match, source, onClosed);
}
