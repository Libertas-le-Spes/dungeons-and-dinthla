import type { NoteRef } from "../../../host/notes/note-ref";
import { INVENTORY_SECTION } from "../../../imports/layout/plugin-sections";
import { ActionButton } from "../../../views/components/buttons/action-button";
import { List, Paragraph, Span } from "../../../views/elements/kinds/containers";
import type { ViewElement } from "../../../views/elements/view-element";
import { isImporterWritten } from "../lists/importer-written";
import type { ImportedLists } from "../lists/imported-lists";
import { inventoryEntryOf, type InventoryEntry } from "../lists/inventory-entry";
import type { SectionEntries } from "../lists/section-entries";
import type { FundsLook, ItemTracking } from "../tracking/item-tracking";
import { TrackRun } from "../tracking/tracking-runs";
import { heldButNotImported } from "./held-not-imported";
import { leftOut, nothingCameIn, panelLine, panelSection } from "./panel-parts";
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
    private readonly file: NoteRef,
    private readonly tracking: ItemTracking,
  ) {}

  treeOf(lists: ImportedLists): ViewElement {
    const listed = lists.of(INVENTORY_SECTION);
    const entries: InventoryEntry[] = [];
    for (const text of listed.entries) entries.push(inventoryEntryOf(text));
    const look = this.tracking.lookAt(this.file, writtenOf(entries));
    const lines: ViewElement[] = [];
    for (const entry of entries) lines.push(this.entryOf(entry, look));
    const inside = [new List({ cls: ["dd-list"] }, lines), ...nothingCameIn(listed), ...leftOut(listed)];
    if (look === null) inside.push(...this.whyNotTracked(entries));
    else inside.push(...this.heldButNotImported(listed, look));
    return panelSection("Inventory", entries.length, inside);
  }

  private whyNotTracked(entries: readonly InventoryEntry[]): ViewElement[] {
    if (entries.length === 0) return [];
    return [new Paragraph({ cls: ["dd-note"], text: this.tracking.whyNotTracked(this.file) })];
  }

  private heldButNotImported(listed: SectionEntries, look: FundsLook): ViewElement[] {
    if (!listed.present) return [];
    return heldButNotImported(this.file, look.heldButNotImported(), listed.leftOut, this.tracking);
  }

  private entryOf(entry: InventoryEntry, look: FundsLook | null): ViewElement {
    const after: ViewElement[] = [];
    if (entry.count !== null) after.push(new Span({ cls: ["dd-meta"], text: `× ${entry.count}` }));
    if (look === null) return panelLine(entry.name, after);
    const standing = look.standingOf(entry.written);
    if (standing !== null) after.push(new Span({ cls: ["dd-meta", "dd-panel-standing"], text: standing }));
    if (look.canTrack(entry.written) && isImporterWritten(entry.written)) {
      after.push(new ActionButton(TRACK_ON_FUNDS, PANEL_ACTION_CLASSES, new TrackRun(this.file, entry, this.tracking)).build());
    }
    return panelLine(entry.name, after);
  }
}
