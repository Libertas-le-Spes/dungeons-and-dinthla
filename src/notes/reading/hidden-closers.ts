interface Opening {
  closer: string | null;
  next: number;
  hides: boolean;
}

export interface BlockMarker {
  opener: string;
  opening(prose: string, at: number): Opening;
}

class CommentMarker implements BlockMarker {
  constructor(
    readonly opener: string,
    private readonly closer: string,
  ) {}

  opening(_prose: string, at: number): Opening {
    return { closer: this.closer, next: at + this.opener.length, hides: true };
  }
}

const MATH_MARK = "$$";

function nothingFrom(prose: string, from: number): boolean {
  return prose.substring(from).trim() === "";
}

class MathMarker implements BlockMarker {
  readonly opener = MATH_MARK;

  opening(prose: string, at: number): Opening {
    const after = at + MATH_MARK.length;
    const end = prose.indexOf(MATH_MARK, after);
    if (end !== -1) return { closer: null, next: end + MATH_MARK.length, hides: true };
    if (nothingFrom(prose, after)) return { closer: MATH_MARK, next: after, hides: true };
    return { closer: null, next: after, hides: false };
  }
}

export const BLOCK_MARKERS: ReadonlyArray<BlockMarker> = [new CommentMarker("%%", "%%"), new MathMarker(), new CommentMarker("<!--", "-->")];
