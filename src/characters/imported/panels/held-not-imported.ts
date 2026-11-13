import type { TFile } from "obsidian";
import { addActionButton } from "../drawing/action-button";
import type { ItemTracking } from "../tracking/item-tracking";
import { SETTLE_CHOICES } from "../tracking/settle-choices";
import { SettleRun } from "../tracking/tracking-runs";
import { addPanelLine } from "./panel-parts";

export const HELD_NOT_IMPORTED = "On the funds page, but not on this import";
export const PICK_WHAT_HAPPENED = "Pick what happened to each. Nothing is written until you save it in the item dialog.";
const CHOICE_CLASSES = ["dd-create", "dd-panel-action"];

function addChoices(line: HTMLElement, file: TFile, name: string, tracking: ItemTracking): void {
  const choices = line.createDiv({ cls: "dd-panel-choices" });
  for (const choice of SETTLE_CHOICES) addActionButton(choices, choice.label, CHOICE_CLASSES, new SettleRun(file, name, choice, tracking));
}

export function addHeldButNotImported(panel: HTMLElement, file: TFile, names: readonly string[], tracking: ItemTracking): void {
  if (names.length === 0) return;
  panel.createEl("h3", { cls: "dd-holder", text: HELD_NOT_IMPORTED });
  panel.createEl("p", { cls: "dd-note", text: PICK_WHAT_HAPPENED });
  const list = panel.createEl("ul", { cls: "dd-list dd-held-not-imported" });
  for (const name of names) addChoices(addPanelLine(list, name), file, name, tracking);
}
