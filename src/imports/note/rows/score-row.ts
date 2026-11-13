import type { AbilityScores } from "../../../beyond/shape/ability-scores";
import type { WorkedValue } from "../../../beyond/shape/worked-value";
import {
  CHARISMA_PROPERTY,
  CONSTITUTION_PROPERTY,
  DEXTERITY_PROPERTY,
  INTELLIGENCE_PROPERTY,
  STRENGTH_PROPERTY,
  WISDOM_PROPERTY,
} from "../../layout/import-properties";

export interface ScoreRow {
  readonly name: string;
  valueOf(scores: AbilityScores): WorkedValue<number>;
}

export class StrengthRow implements ScoreRow {
  readonly name = STRENGTH_PROPERTY;

  valueOf(scores: AbilityScores): WorkedValue<number> {
    return scores.strength;
  }
}

export class DexterityRow implements ScoreRow {
  readonly name = DEXTERITY_PROPERTY;

  valueOf(scores: AbilityScores): WorkedValue<number> {
    return scores.dexterity;
  }
}

export class ConstitutionRow implements ScoreRow {
  readonly name = CONSTITUTION_PROPERTY;

  valueOf(scores: AbilityScores): WorkedValue<number> {
    return scores.constitution;
  }
}

export class IntelligenceRow implements ScoreRow {
  readonly name = INTELLIGENCE_PROPERTY;

  valueOf(scores: AbilityScores): WorkedValue<number> {
    return scores.intelligence;
  }
}

export class WisdomRow implements ScoreRow {
  readonly name = WISDOM_PROPERTY;

  valueOf(scores: AbilityScores): WorkedValue<number> {
    return scores.wisdom;
  }
}

export class CharismaRow implements ScoreRow {
  readonly name = CHARISMA_PROPERTY;

  valueOf(scores: AbilityScores): WorkedValue<number> {
    return scores.charisma;
  }
}
