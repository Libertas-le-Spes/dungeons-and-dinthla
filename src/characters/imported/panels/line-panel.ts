import type { PluginSection } from "../../../imports/layout/plugin-section";
import type { ImportedLists } from "../lists/imported-lists";
import { withoutEscapes } from "../reading/shown-text";
import { addLeftOut, addNothingCameIn, addPanelLine, addPanelSection } from "./panel-parts";
import type { SheetPanel } from "./sheet-panel";

export class LinePanel implements SheetPanel {
  constructor(
    private readonly title: string,
    private readonly section: PluginSection,
  ) {}

  addTo(root: HTMLElement, lists: ImportedLists): void {
    const listed = lists.of(this.section);
    const panel = addPanelSection(root, this.title, listed.entries.length);
    const list = panel.createEl("ul", { cls: "dd-list" });
    for (const entry of listed.entries) addPanelLine(list, withoutEscapes(entry));
    addNothingCameIn(panel, listed);
    addLeftOut(panel, listed);
  }
}
