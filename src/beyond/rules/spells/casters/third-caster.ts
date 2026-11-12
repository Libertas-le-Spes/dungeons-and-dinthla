import type { CasterKind } from "./caster-kind";
import { THIRD_SLOTS } from "../slots/tables/third-slots";

export class ThirdCaster implements CasterKind {
  readonly label = "third caster";
  readonly table = THIRD_SLOTS;
  readonly contributes = true;
  readonly differsByEdition = true;

  casterLevelOf(classLevel: number): number {
    return Math.floor(classLevel / 3);
  }
}
