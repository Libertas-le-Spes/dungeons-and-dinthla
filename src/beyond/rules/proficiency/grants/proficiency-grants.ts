import { ExpertiseGrant } from "./expertise-grant";
import { FullProficiencyGrant } from "./full-proficiency-grant";
import { HalfProficiencyGrant } from "./half-proficiency-grant";
import { NoProficiency } from "./no-proficiency";
import type { ProficiencyGrant } from "./proficiency-grant";

export const PROFICIENCY_GRANTS: readonly ProficiencyGrant[] = [new ExpertiseGrant(), new FullProficiencyGrant(), new HalfProficiencyGrant(), new NoProficiency()];
