import type { NoteRef } from "../../../host/notes/note-ref";
import { addActionButton } from "../drawing/action-button";
import { hasLeftOut, type LeftOutCounts } from "../lists/left-out-counts";
import type { HeldItem, ItemTracking } from "../tracking/item-tracking";
import { SETTLE_CHOICES } from "../tracking/settle-choices";
import { SettleRun } from "../tracking/tracking-runs";
import { addPanelLine } from "./panel-parts";

export const HELD_NOT_IMPORTED = "On the funds page, but not on this import";
export const PICK_WHAT_HAPPENED = "Pick what happened to each.";
export const MAY_BE_LEFT_OUT = "Some may still be held.";
const CHOICE_CLASSES = ["dd-create", "dd-panel-action"];

function addChoices(line: HTMLElement, file: NoteRef, name: string, tracking: ItemTracking): void {
  const choices = line.createDiv({ cls: "dd-panel-choices" });
  for (const choice of SETTLE_CHOICES) addActionButton(choices, choice.label, CHOICE_CLASSES, new SettleRun(file, name, choice, tracking));
}

function addMayBeLeftOut(panel: HTMLElement, leftOut: LeftOutCounts | null): void {
  if (leftOut === null || !hasLeftOut(leftOut)) return;
  panel.createEl("p", { cls: "dd-note dd-may-be-left-out", text: MAY_BE_LEFT_OUT });
}

export function addHeldButNotImported(panel: HTMLElement, file: NoteRef, held: readonly HeldItem[], leftOut: LeftOutCounts | null, tracking: ItemTracking): void {
  if (held.length === 0) return;
  panel.createEl("h3", { cls: "dd-holder", text: HELD_NOT_IMPORTED });
  panel.createEl("p", { cls: "dd-note", text: PICK_WHAT_HAPPENED });
  addMayBeLeftOut(panel, leftOut);
  const list = panel.createEl("ul", { cls: "dd-list dd-held-not-imported" });
  for (const item of held) addChoices(addPanelLine(list, item.shown), file, item.name, tracking);
}
