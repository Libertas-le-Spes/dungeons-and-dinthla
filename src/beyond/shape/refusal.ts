import type { Cap } from "./cap";

export class Refusal extends Error {}

export function overTheLimit(cap: Cap): Refusal {
  return new Refusal(`${cap.what} is over the limit of ${cap.most} ${cap.unit}.`);
}
