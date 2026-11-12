import { BarbarianDefenceRule } from "./barbarian-defence-rule";
import { BodyArmourRule } from "./body-armour-rule";
import { DraconicDefenceRule } from "./draconic-defence-rule";
import { MonkDefenceRule } from "./monk-defence-rule";
import type { ArmourRule } from "./armour-rule";
import { PlainDefenceRule } from "./plain-defence-rule";

export const ARMOUR_RULES_FIRST_WINS_A_TIE: readonly ArmourRule[] = [new BodyArmourRule(), new PlainDefenceRule(), new MonkDefenceRule(), new BarbarianDefenceRule(), new DraconicDefenceRule()];
