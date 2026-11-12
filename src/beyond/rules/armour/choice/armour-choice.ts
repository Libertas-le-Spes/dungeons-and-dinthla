import type { EarlierNumbers } from "../../core/earlier-numbers";
import type { RuleCharacter } from "../../input/rule-character";
import type { ArmourCandidate } from "./armour-candidate";
import { ARMOUR_RULES } from "../rules/armour-rules";
import type { WornArmour } from "./worn-armour";

export function candidatesFor(character: RuleCharacter, worn: WornArmour, earlier: EarlierNumbers): readonly ArmourCandidate[] {
  const found: ArmourCandidate[] = [];
  for (const rule of ARMOUR_RULES) {
    const candidate = rule.candidate(character, worn, earlier);
    if (candidate !== null) found.push(candidate);
  }
  return found;
}

export function firstUnknown(candidates: readonly ArmourCandidate[]): ArmourCandidate | undefined {
  return candidates.find((candidate) => !candidate.isKnown);
}

export function bestOf(candidates: readonly ArmourCandidate[]): ArmourCandidate | undefined {
  let best: ArmourCandidate | undefined = undefined;
  for (const candidate of candidates) {
    if (best === undefined) best = candidate;
    else if (candidate.total > best.total) best = candidate;
  }
  return best;
}
