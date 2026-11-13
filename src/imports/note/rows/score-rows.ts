import { CharismaRow, ConstitutionRow, DexterityRow, IntelligenceRow, type ScoreRow, StrengthRow, WisdomRow } from "./score-row";

export const SCORE_ROWS: readonly ScoreRow[] = [new StrengthRow(), new DexterityRow(), new ConstitutionRow(), new IntelligenceRow(), new WisdomRow(), new CharismaRow()];
