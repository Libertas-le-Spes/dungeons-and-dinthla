import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import type { PluginSection } from "../../layout/plugin-section";

export interface SectionContent {
  readonly section: PluginSection;
  linesOf(sheet: PrintedSheet): string[];
}
