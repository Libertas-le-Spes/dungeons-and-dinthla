import type { RuleCharacter } from "../../input/rule-character";
import { NoProficiency } from "./no-proficiency";
import type { ProficiencyClaim, ProficiencyGrant } from "./proficiency-grant";
import { PROFICIENCY_GRANTS } from "./proficiency-grants";

function grantsFor(character: RuleCharacter, claim: ProficiencyClaim): (grant: ProficiencyGrant) => boolean {
  return function grants(grant: ProficiencyGrant): boolean {
    return grant.grants(character, claim);
  };
}

export function grantFor(character: RuleCharacter, claim: ProficiencyClaim): ProficiencyGrant {
  const found = PROFICIENCY_GRANTS.find(grantsFor(character, claim));
  if (found === undefined) return new NoProficiency();
  return found;
}
