import type { ImportedNumber } from "../../../shape/imported-number";
import { spellAttackNameOf, spellSaveDcNameOf } from "../../core/number-names";
import { SPELLCASTING_TOUCHING } from "../../core/touching-lists";
import type { Rule } from "../../core/rule";
import { notKnown } from "../../core/worked";
import type { RuleCharacter } from "../../input/rule-character";

export class UnbuiltCasterRule implements Rule {
  workOut(character: RuleCharacter): readonly ImportedNumber[] {
    const found: ImportedNumber[] = [];
    for (const name of SPELLCASTING_TOUCHING.named(character)) {
      const reason = notKnown(`${name} is not built here yet.`, character.route);
      found.push({ name: spellSaveDcNameOf(name), value: reason });
      found.push({ name: spellAttackNameOf(name), value: reason });
    }
    return found;
  }
}
