import { MarkdownView, type App, type Editor, type EditorPosition, type EditorSuggestContext } from "obsidian";
import type { Source } from "../campaign/campaign";
import { PROPERTIES_WOULD_CHANGE } from "../campaign/note-editor";
import { keepsProperties } from "../campaign/session-file";
import type { LookupMatch } from "./lookup";

export const NOT_IN_A_NOTE_VIEW = "Lookups work in a note opened in its own tab, so nothing was changed.";

export interface LookupOpeners {
  question(source: Source, onClosed: () => void): void;
  quest(source: Source, onClosed: () => void): void;
  item(name: string, source: Source, onClosed: () => void): void;
}

export function lineRange(editor: Editor, line: number): { from: EditorPosition; to: EditorPosition } {
  if (line + 1 < editor.lineCount()) return { from: { line, ch: 0 }, to: { line: line + 1, ch: 0 } };
  if (line === 0) return { from: { line, ch: 0 }, to: { line, ch: editor.getLine(line).length } };
  return { from: { line: line - 1, ch: editor.getLine(line - 1).length }, to: { line, ch: editor.getLine(line).length } };
}

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

function withoutLine(text: string, line: number): string {
  const lines = text.split("\n");
  lines.splice(line, 1);
  return lines.join("\n");
}

export async function openLookup(
  app: App,
  match: LookupMatch,
  context: EditorSuggestContext,
  noteChanged: (path: string, text: string) => void,
  openers: LookupOpeners,
): Promise<void> {
  const { editor, file } = context;
  const line = context.start.line;
  const view = viewOf(app, editor);
  if (view === undefined) throw new Error(NOT_IN_A_NOTE_VIEW);
  const before = editor.getValue();
  if (!keepsProperties(before, withoutLine(before, line))) throw new Error(PROPERTIES_WOULD_CHANGE);
  const { from, to } = lineRange(editor, line);
  editor.replaceRange("", from, to);
  await view.save();
  noteChanged(file.path, editor.getValue());
  const source = sourceAfterRemoving(match.source, file.path, line);
  const onClosed = () => editor.focus();
  if (match.kind === "question") openers.question(source, onClosed);
  else if (match.kind === "quest") openers.quest(source, onClosed);
  else openers.item(match.text, source, onClosed);
}
