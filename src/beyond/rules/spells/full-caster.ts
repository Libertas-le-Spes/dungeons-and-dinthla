import type { CasterKind } from "./caster-kind";
import { FULL_SLOTS } from "./tables/full-slots";

export class FullCaster implements CasterKind {
  readonly label = "full caster";
  readonly table = FULL_SLOTS;
  readonly contributes = true;
  readonly differsByEdition = false;

  casterLevelOf(classLevel: number): number {
    return classLevel;
  }
}
