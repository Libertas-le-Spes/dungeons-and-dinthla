import { NoProficiency } from "./no-proficiency";
import type { ProficiencyClaim, ProficiencyGrant } from "./proficiency-grant";
import { PROFICIENCY_GRANTS } from "./proficiency-grants";
import type { RuleCharacter } from "../input/rule-character";

export function grantFor(character: RuleCharacter, claim: ProficiencyClaim): ProficiencyGrant {
  const found = PROFICIENCY_GRANTS.find((grant) => grant.grants(character, claim));
  if (found === undefined) return new NoProficiency();
  return found;
}
