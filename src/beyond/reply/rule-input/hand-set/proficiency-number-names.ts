import { ABILITIES } from "../../../rules/input/ability";
import { INITIATIVE_NAME } from "../../../rules/core/number-names";
import { SKILLS } from "../../../rules/proficiency/skills/skills";
import { INSIGHT, INVESTIGATION, PERCEPTION } from "../../../rules/proficiency/skills/skills";

export const PROFICIENCY_NUMBER_NAMES: readonly string[] = [
  INITIATIVE_NAME,
  ...ABILITIES.map((ability) => ability.saveName),
  ...SKILLS.map((skill) => skill.name),
  PERCEPTION.passiveName,
  INVESTIGATION.passiveName,
  INSIGHT.passiveName,
];
