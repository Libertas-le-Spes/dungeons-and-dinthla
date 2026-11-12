import { unknownAmong } from "../core/unknown-among";
import type { EarlierNumbers } from "../core/earlier-numbers";
import type { RuleCharacter } from "../input/rule-character";
import { UnknownCandidate } from "./armour-candidate";

export function unknownCandidateAmong(names: readonly string[], character: RuleCharacter, earlier: EarlierNumbers): UnknownCandidate | null {
  const missing = unknownAmong(names, earlier, character.route);
  if (missing === null) return null;
  return new UnknownCandidate(missing.explanation);
}
