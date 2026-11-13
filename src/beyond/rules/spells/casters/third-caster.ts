import { isTwentyFourteen } from "../../input/edition";
import type { Edition } from "../../input/edition";
import type { CasterKind } from "./caster-kind";
import { THIRD_SLOTS } from "../slots/tables/third-slots";

export class ThirdCaster implements CasterKind {
  readonly label = "third caster";
  readonly table = THIRD_SLOTS;
  readonly contributes = true;
  readonly firstCastingLevel = 3;

  editionKnows(edition: Edition): boolean {
    return isTwentyFourteen(edition);
  }

  casterLevelOf(classLevel: number): number {
    return Math.floor(classLevel / 3);
  }
}
