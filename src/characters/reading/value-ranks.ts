import type { StatedValue, ValueState } from "./character-sheet";

export interface Rank {
  readonly state: ValueState;
  readonly stated: StatedValue | null;
  readonly questionMarkMeansUnknown: boolean;
}

export interface Ranked {
  readonly state: ValueState;
  readonly shown: StatedValue;
}

function stateShown(rank: Rank, shown: StatedValue, notKnown: string): ValueState {
  if (rank.questionMarkMeansUnknown && shown.value === notKnown) return "unknown";
  return rank.state;
}

export function firstRanked(ranks: readonly Rank[], notKnown: string): Ranked | null {
  for (const rank of ranks) {
    const shown = rank.stated;
    if (shown !== null) return { state: stateShown(rank, shown, notKnown), shown };
  }
  return null;
}
