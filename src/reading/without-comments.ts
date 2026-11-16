const LINE_BREAK = "\n";

interface CommentKind {
  opener: string;
  closer: string;
}

interface FoundComment {
  start: number;
  end: number;
}

const COMMENT_KINDS: CommentKind[] = [
  { opener: "%%", closer: "%%" },
  { opener: "<!--", closer: "-->" },
];

function endOf(text: string, kind: CommentKind, start: number): number {
  const closer = text.indexOf(kind.closer, start + kind.opener.length);
  if (closer === -1) return text.length;
  return closer + kind.closer.length;
}

function earlier(found: FoundComment | null, start: number): boolean {
  if (found === null) return true;
  return start < found.start;
}

function nextComment(text: string, from: number): FoundComment | null {
  let found: FoundComment | null = null;
  for (const kind of COMMENT_KINDS) {
    const start = text.indexOf(kind.opener, from);
    if (start !== -1 && earlier(found, start)) found = { start, end: endOf(text, kind, start) };
  }
  return found;
}

function lineBreaksOf(comment: string): string {
  const breaks: string[] = [];
  for (const character of comment) {
    if (character === LINE_BREAK) breaks.push(LINE_BREAK);
  }
  return breaks.join("");
}

export function withoutComments(text: string): string {
  const kept: string[] = [];
  let from = 0;
  for (let comment = nextComment(text, from); comment !== null; comment = nextComment(text, from)) {
    kept.push(text.substring(from, comment.start));
    kept.push(lineBreaksOf(text.substring(comment.start, comment.end)));
    from = comment.end;
  }
  kept.push(text.substring(from));
  return kept.join("");
}
