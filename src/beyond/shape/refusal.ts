import type { Cap } from "./cap";

export class Refusal extends Error {}

export function overTheLimit(cap: Cap): Refusal {
  return new Refusal(`${cap.what} is over the limit of ${cap.most} ${cap.unit}.`);
}

export function lineBreakInOneLine(): Refusal {
  return new Refusal("A value that has to be on one line holds a line break.");
}
