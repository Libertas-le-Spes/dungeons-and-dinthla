import type { PluginSection } from "../../layout/plugin-section";

export interface SectionSpan {
  readonly section: PluginSection;
  readonly start: number;
  readonly end: number;
}
