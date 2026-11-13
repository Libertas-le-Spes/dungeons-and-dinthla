import { Refusal } from "../../../beyond/shape/refusal";
import type { PluginSection } from "../../layout/plugin-section";

export function twoSections(section: PluginSection): Refusal {
  return new Refusal(`The note has two "${section.heading}" sections, so nothing was written. Remove one.`);
}
