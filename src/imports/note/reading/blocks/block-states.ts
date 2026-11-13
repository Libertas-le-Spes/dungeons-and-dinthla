import type { BlockState } from "./block-state";

const FENCE = /^ {0,3}(?<marker>`{3,}|~{3,})/;

interface CommentKind {
  readonly opener: string;
  readonly closer: string;
}

const COMMENT_KINDS: readonly CommentKind[] = [
  { opener: "<!--", closer: "-->" },
  { opener: "%%", closer: "%%" },
];

function fenceMarkerIn(line: string): string | null {
  const match = FENCE.exec(line);
  if (match === null || match.groups === undefined) return null;
  const marker = match.groups.marker;
  if (marker === undefined) return null;
  return marker;
}

function earliestComment(line: string, from: number): { kind: CommentKind; at: number } | null {
  let found: { kind: CommentKind; at: number } | null = null;
  for (const kind of COMMENT_KINDS) {
    const at = line.indexOf(kind.opener, from);
    if (at === -1) continue;
    if (found === null || at < found.at) found = { kind, at };
  }
  return found;
}

function stateAfter(line: string, inside: CommentKind | null): BlockState {
  let open = inside;
  let offset = 0;
  while (true) {
    if (open === null) {
      const comment = earliestComment(line, offset);
      if (comment === null) return OPEN_TEXT;
      open = comment.kind;
      offset = comment.at + comment.kind.opener.length;
    } else {
      const at = line.indexOf(open.closer, offset);
      if (at === -1) return new InComment(open);
      offset = at + open.closer.length;
      open = null;
    }
  }
}

class InComment implements BlockState {
  readonly allowsHeading = false;
  readonly isClosed = false;

  constructor(private readonly kind: CommentKind) {}

  after(line: string): BlockState {
    return stateAfter(line, this.kind);
  }
}

class InFence implements BlockState {
  readonly allowsHeading = false;
  readonly isClosed = false;

  constructor(private readonly opening: string) {}

  after(line: string): BlockState {
    const marker = fenceMarkerIn(line);
    if (marker === null) return this;
    if (marker.charAt(0) !== this.opening.charAt(0)) return this;
    if (marker.length < this.opening.length) return this;
    return OPEN_TEXT;
  }
}

class OpenText implements BlockState {
  readonly allowsHeading = true;
  readonly isClosed = true;

  after(line: string): BlockState {
    const marker = fenceMarkerIn(line);
    if (marker !== null) return new InFence(marker);
    return stateAfter(line, null);
  }
}

const OPEN_TEXT = new OpenText();

export function openText(): BlockState {
  return OPEN_TEXT;
}
