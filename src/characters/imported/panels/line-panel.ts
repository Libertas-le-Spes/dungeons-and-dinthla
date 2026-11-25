import type { PluginSection } from "../../../imports/layout/plugin-section";
import { List } from "../../../views/elements/kinds/containers";
import type { ViewElement } from "../../../views/elements/view-element";
import type { ImportedLists } from "../lists/imported-lists";
import { withoutEscapes } from "../reading/shown-text";
import { leftOut, nothingCameIn, panelLine, panelSection } from "./panel-parts";
import type { SheetPanel } from "./sheet-panel";

export class LinePanel implements SheetPanel {
  constructor(
    private readonly title: string,
    private readonly section: PluginSection,
  ) {}

  treeOf(lists: ImportedLists): ViewElement {
    const listed = lists.of(this.section);
    const lines: ViewElement[] = [];
    for (const entry of listed.entries) lines.push(panelLine(withoutEscapes(entry), []));
    return panelSection(this.title, listed.entries.length, [new List({ cls: ["dd-list"] }, lines), ...nothingCameIn(listed), ...leftOut(listed)]);
  }
}
