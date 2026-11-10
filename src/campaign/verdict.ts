export interface Refused {
  refused: string;
}

export type Verdict = "go on" | "write nothing" | Refused;

export function refusedWhen(refuses: boolean, words: string): Verdict {
  if (refuses) return { refused: words };
  return "go on";
}

export function verdictOf(refusal: string | null): Verdict {
  if (refusal === null) return "go on";
  return { refused: refusal };
}

export function writeNothingWhen(writesNothing: boolean): Verdict {
  if (writesNothing) return "write nothing";
  return "go on";
}
