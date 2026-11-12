import { NotKnownValue } from "../../shape/not-known-value";
import type { WorkedValue } from "../../shape/worked-value";
import { ONLINE } from "../common/online-route";

const NOT_STATED = "D&D Beyond does not state armor class. It is worked out from armor, abilities and modifiers, in a later step.";

export function armourClassNotStated(): WorkedValue<number> {
  return new NotKnownValue(NOT_STATED, ONLINE);
}
