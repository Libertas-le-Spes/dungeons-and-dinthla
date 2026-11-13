import type { TFile } from "obsidian";
import { INVENTORY_SECTION } from "../../../imports/layout/plugin-sections";
import { addActionButton } from "../drawing/action-button";
import { isImporterWritten } from "../lists/importer-written";
import type { ImportedLists } from "../lists/imported-lists";
import { inventoryEntryOf, type InventoryEntry } from "../lists/inventory-entry";
import type { SectionEntries } from "../lists/section-entries";
import type { FundsLook, ItemTracking } from "../tracking/item-tracking";
import { TrackRun } from "../tracking/tracking-runs";
import { addHeldButNotImported } from "./held-not-imported";
import { addLeftOut, addNothingCameIn, addPanelLine, addPanelSection } from "./panel-parts";
import type { SheetPanel } from "./sheet-panel";

export const TRACK_ON_FUNDS = "Track on the funds page";
const PANEL_ACTION_CLASSES = ["dd-create", "dd-panel-action"];

function writtenOf(entries: readonly InventoryEntry[]): string[] {
  const written: string[] = [];
  for (const entry of entries) written.push(entry.written);
  return written;
}

export class InventoryPanel implements SheetPanel {
  constructor(
    private readonly file: TFile,
    private readonly tracking: ItemTracking,
  ) {}

  addTo(root: HTMLElement, lists: ImportedLists): void {
    const listed = lists.of(INVENTORY_SECTION);
    const entries: InventoryEntry[] = [];
    for (const text of listed.entries) entries.push(inventoryEntryOf(text));
    const look = this.tracking.lookAt(this.file, writtenOf(entries));
    const panel = addPanelSection(root, "Inventory", entries.length);
    const list = panel.createEl("ul", { cls: "dd-list" });
    for (const entry of entries) this.addEntry(list, entry, look);
    addNothingCameIn(panel, listed);
    addLeftOut(panel, listed);
    if (look === null) this.addWhyNotTracked(panel, entries);
    else this.addHeldButNotImported(panel, listed, look);
  }

  private addWhyNotTracked(panel: HTMLElement, entries: readonly InventoryEntry[]): void {
    if (entries.length === 0) return;
    panel.createEl("p", { cls: "dd-note", text: this.tracking.whyNotTracked(this.file) });
  }

  private addHeldButNotImported(panel: HTMLElement, listed: SectionEntries, look: FundsLook): void {
    if (!listed.present) return;
    addHeldButNotImported(panel, this.file, look.heldButNotImported(), listed.leftOut, this.tracking);
  }

  private addEntry(list: HTMLElement, entry: InventoryEntry, look: FundsLook | null): void {
    const line = addPanelLine(list, entry.name);
    if (entry.count !== null) line.createSpan({ cls: "dd-meta", text: `× ${entry.count}` });
    if (look === null) return;
    const standing = look.standingOf(entry.written);
    if (standing !== null) line.createSpan({ cls: "dd-meta dd-panel-standing", text: standing });
    if (look.canTrack(entry.written) && isImporterWritten(entry.written)) {
      addActionButton(line, TRACK_ON_FUNDS, PANEL_ACTION_CLASSES, new TrackRun(this.file, entry.written, this.tracking));
    }
  }
}
