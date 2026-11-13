import { isTwentyFourteen } from "../../input/edition";
import type { Edition } from "../../input/edition";
import type { CasterKind } from "./caster-kind";
import { HALF_SLOTS } from "../slots/tables/half-slots";

export class HalfCaster implements CasterKind {
  readonly label = "half caster";
  readonly table = HALF_SLOTS;
  readonly contributes = true;
  readonly firstCastingLevel = 2;

  editionKnows(edition: Edition): boolean {
    return isTwentyFourteen(edition);
  }

  casterLevelOf(classLevel: number): number {
    return Math.floor(classLevel / 2);
  }
}
