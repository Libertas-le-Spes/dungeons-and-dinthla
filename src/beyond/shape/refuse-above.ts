import type { Cap } from "./cap";
import { overTheLimit } from "./refusal";

export function refuseAbove(cap: Cap, size: number): void {
  if (size > cap.most) throw overTheLimit(cap);
}
