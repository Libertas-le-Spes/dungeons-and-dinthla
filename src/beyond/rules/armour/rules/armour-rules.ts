import { BarbarianDefenceRule } from "./barbarian-defence-rule";
import { BodyArmourRule } from "./body-armour-rule";
import { DraconicDefenceRule } from "./draconic-defence-rule";
import { MonkDefenceRule } from "./monk-defence-rule";
import { NaturalArmourRule } from "../natural-armour-rule";
import type { ArmourRule } from "./armour-rule";
import { PlainDefenceRule } from "./plain-defence-rule";

export const ARMOUR_RULES: readonly ArmourRule[] = [
  new BodyArmourRule(),
  new PlainDefenceRule(),
  new MonkDefenceRule(),
  new BarbarianDefenceRule(),
  new DraconicDefenceRule(),
  new NaturalArmourRule(),
];
