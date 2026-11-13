import type { Cap } from "./cap";
import { refuseAbove } from "./refuse-above";

export function limitedList<T>(list: readonly T[], cap: Cap): readonly T[] {
  refuseAbove(cap, list.length);
  return list;
}
