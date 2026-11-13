import type { TFile } from "obsidian";
import { NOT_IN_THE_PDF } from "../../../imports/layout/pdf-gaps";
import { FEATURES_SECTION, SPELLS_SECTION } from "../../../imports/layout/plugin-sections";
import type { ImportedLists } from "../lists/imported-lists";
import type { ItemTracking } from "../tracking/item-tracking";
import { InventoryPanel } from "./inventory-panel";
import { LinePanel } from "./line-panel";
import { PursePanel } from "./purse-panel";
import type { SheetPanel } from "./sheet-panel";

function panelsFor(file: TFile, tracking: ItemTracking): SheetPanel[] {
  return [new InventoryPanel(file, tracking), new PursePanel(), new LinePanel("Spells", SPELLS_SECTION), new LinePanel("Features", FEATURES_SECTION)];
}

export function addImportedPanels(root: HTMLElement, file: TFile, lists: ImportedLists | null, tracking: ItemTracking): void {
  if (lists === null) return;
  const panels = root.createDiv({ cls: "dd-sheet-imported" });
  for (const panel of panelsFor(file, tracking)) panel.addTo(panels, lists);
  if (lists.isFromPdf) panels.createEl("p", { cls: "dd-note dd-pdf-gaps", text: NOT_IN_THE_PDF });
}
