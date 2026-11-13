import type { AbilityScores } from "../../../beyond/shape/ability-scores";
import type { WorkedValue } from "../../../beyond/shape/worked-value";

export class ScoreRow {
  constructor(
    readonly name: string,
    private readonly key: keyof AbilityScores,
  ) {}

  valueOf(scores: AbilityScores): WorkedValue<number> {
    return scores[this.key];
  }
}
