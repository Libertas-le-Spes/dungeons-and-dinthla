import type { EarlierNumbers } from "../../core/earlier-numbers";
import type { Ability } from "../../input/ability";
import type { RuleCharacter } from "../../input/rule-character";
import type { ArmourCandidate } from "../choice/armour-candidate";
import { KnownCandidate } from "../choice/armour-candidate";
import { unknownCandidateAmong } from "../choice/unknown-candidate-among";

export function abilityDefence(character: RuleCharacter, earlier: EarlierNumbers, second: Ability, reason: string): ArmourCandidate {
  const names = ["DEX modifier", `${second.short} modifier`];
  const unknown = unknownCandidateAmong(names, character, earlier);
  if (unknown !== null) return unknown;
  const dexterity = earlier.valueOf("DEX modifier", character.route).valueOr(0);
  const other = earlier.valueOf(`${second.short} modifier`, character.route).valueOr(0);
  return new KnownCandidate(10 + dexterity + other, ["10", `DEX ${dexterity}`, `${second.short} ${other}`], reason);
}
