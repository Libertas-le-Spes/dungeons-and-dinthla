import type { WorkedValue } from "../../../beyond/shape/worked-value";
import { neutralPartOf, pluginLineOf } from "./plugin-line";
import { valueTextOf } from "./worked-text";

export function numberLineOf(name: string, value: WorkedValue<number>): string {
  const parts = [neutralPartOf(name), valueTextOf(value)];
  if (value.explanation !== "") parts.push(neutralPartOf(value.explanation));
  parts.push(value.route.source);
  return pluginLineOf(parts);
}
