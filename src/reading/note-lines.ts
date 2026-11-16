import { withoutComments } from "./without-comments";

const LINE_BREAK = "\n";

export class NoteLines {
  private text: string | null = null;
  private lines: string[] = [];

  of(text: string): string[] {
    if (text === this.text) return this.lines;
    this.text = text;
    this.lines = withoutComments(text).split(LINE_BREAK);
    return this.lines;
  }
}
