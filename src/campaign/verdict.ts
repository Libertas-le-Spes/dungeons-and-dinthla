export type Verdict = "go on" | "write nothing" | { error: string };

export function isError(value: unknown): value is { error: string } {
  return typeof value === "object" && value !== null && "error" in value;
}

export function refusedWhen(refuses: boolean, words: string): Verdict {
  if (refuses) return { error: words };
  return "go on";
}

export function verdictOf(refusal: string | null): Verdict {
  if (refusal === null) return "go on";
  return { error: refusal };
}

export function writeNothingWhen(writesNothing: boolean): Verdict {
  if (writesNothing) return "write nothing";
  return "go on";
}
