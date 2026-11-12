import type { EarlierNumbers } from "../../core/earlier-numbers";
import type { RuleCharacter } from "../../input/rule-character";
import type { ArmourCandidate } from "./armour-candidate";
import { ARMOUR_RULES_FIRST_WINS_A_TIE } from "../rules/armour-rules";
import type { WornArmour } from "./worn-armour";

export function candidatesFor(character: RuleCharacter, worn: WornArmour, earlier: EarlierNumbers): readonly ArmourCandidate[] {
  const found: ArmourCandidate[] = [];
  for (const rule of ARMOUR_RULES_FIRST_WINS_A_TIE) {
    found.push(...rule.candidates(character, worn, earlier));
  }
  return found;
}

function isUnknown(candidate: ArmourCandidate): boolean {
  return !candidate.isKnown;
}

export function firstUnknown(candidates: readonly ArmourCandidate[]): ArmourCandidate | undefined {
  return candidates.find(isUnknown);
}

export function bestOf(candidates: readonly ArmourCandidate[]): ArmourCandidate | undefined {
  let best: ArmourCandidate | undefined = undefined;
  for (const candidate of candidates) {
    if (best === undefined) best = candidate;
    else if (candidate.total > best.total) best = candidate;
  }
  return best;
}
