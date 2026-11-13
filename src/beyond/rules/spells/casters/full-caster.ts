import type { CasterKind } from "./caster-kind";
import { FULL_SLOTS } from "../slots/tables/full-slots";

export class FullCaster implements CasterKind {
  readonly label = "full caster";
  readonly table = FULL_SLOTS;
  readonly contributes = true;
  readonly firstCastingLevel = 1;

  editionKnows(): boolean {
    return true;
  }

  casterLevelOf(classLevel: number): number {
    return classLevel;
  }
}
