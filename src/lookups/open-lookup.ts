import { MarkdownView, type App, type Editor, type EditorPosition, type EditorSuggestContext } from "obsidian";
import type { Source } from "../campaign/campaign";
import type { LookupMatch } from "./lookup";

export interface LookupOpeners {
  question(source: Source): void;
  quest(source: Source): void;
  item(name: string, source: Source): void;
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

export async function openLookup(
  app: App,
  match: LookupMatch,
  context: EditorSuggestContext,
  noteChanged: (path: string, text: string) => void,
  openers: LookupOpeners,
): Promise<void> {
  const { editor, file } = context;
  const line = context.start.line;
  const { from, to } = lineRange(editor, line);
  editor.replaceRange("", from, to);
  const view = app.workspace.getActiveViewOfType(MarkdownView);
  if (view !== null) await view.save();
  noteChanged(file.path, editor.getValue());
  const source = sourceAfterRemoving(match.source, file.path, line);
  if (match.kind === "question") openers.question(source);
  else if (match.kind === "quest") openers.quest(source);
  else openers.item(match.text, source);
}
