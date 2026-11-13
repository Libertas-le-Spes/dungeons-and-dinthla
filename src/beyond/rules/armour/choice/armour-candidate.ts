export interface ArmourCandidate {
  readonly isKnown: boolean;
  readonly total: number;
  readonly terms: readonly string[];
  readonly reason: string;
}

export class KnownCandidate implements ArmourCandidate {
  readonly isKnown = true;

  constructor(
    readonly total: number,
    readonly terms: readonly string[],
    readonly reason: string,
  ) {}
}

export class UnknownCandidate implements ArmourCandidate {
  readonly isKnown = false;
  readonly total = 0;
  readonly terms: readonly string[] = [];

  constructor(readonly reason: string) {}
}
