import type { ProficiencyGrant } from "./proficiency-grant";

export class NoProficiency implements ProficiencyGrant {
  grants(): boolean {
    return true;
  }

  shareOf(): number {
    return 0;
  }

  termsFor(): readonly string[] {
    return [];
  }
}
