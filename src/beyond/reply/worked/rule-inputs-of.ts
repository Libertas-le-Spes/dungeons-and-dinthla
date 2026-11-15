import { speciesOf } from "../parts/read-identity";
import { ONLINE } from "../common/online-route";
import type { JsonReader } from "../json/json-reader";
import { hitPointInputsOf } from "../rule-input/body/read-hit-points";
import { ruleClassesOf } from "../rule-input/body/read-rule-classes";
import { ruleFeaturesOf } from "../rule-input/features/read-rule-features";
import { ruleItemsOf } from "../rule-input/items/read-rule-items";
import { ruleModifiersOf } from "../rule-input/modifiers/read-rule-modifiers";
import { scoreInputsOf } from "../rule-input/scores/read-scores";
import { speedInputsOf } from "../rule-input/body/read-walking-speed";
import type { RuleInputs } from "./rule-inputs";

export function ruleInputsOf(data: JsonReader): RuleInputs {
  const scores = scoreInputsOf(data);
  const hitPoints = hitPointInputsOf(data);
  const speed = speedInputsOf(data);
  return {
    character: {
      route: ONLINE,
      edition: "not stated",
      species: speciesOf(data).text,
      classes: ruleClassesOf(data),
      baseScores: scores.base,
      bonusScores: scores.bonus,
      scoreOverrides: scores.overrides,
      baseHitPoints: hitPoints.base,
      bonusHitPoints: hitPoints.bonus,
      overrideHitPoints: hitPoints.override,
      removedHitPoints: hitPoints.removed,
      temporaryHitPoints: hitPoints.temporary,
      walkingSpeed: speed.walking,
      items: ruleItemsOf(data),
      modifiers: ruleModifiersOf(data),
      features: ruleFeaturesOf(data),
    },
    doubts: [...scores.doubts, ...hitPoints.doubts, ...speed.doubts],
  };
}
