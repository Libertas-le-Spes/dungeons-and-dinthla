import type { NoteRef } from "../../../host/notes/note-ref";
import { ActionButton } from "../../../views/components/buttons/action-button";
import { Div, Heading3, List, Paragraph } from "../../../views/elements/kinds/containers";
import type { ViewElement } from "../../../views/elements/view-element";
import { hasLeftOut, type LeftOutCounts } from "../lists/left-out-counts";
import type { HeldItem, ItemTracking } from "../tracking/item-tracking";
import { SETTLE_CHOICES } from "../tracking/settle-choices";
import { SettleRun } from "../tracking/tracking-runs";
import { panelLine } from "./panel-parts";

export const HELD_NOT_IMPORTED = "On the funds page, but not on this import";
export const PICK_WHAT_HAPPENED = "Pick what happened to each.";
export const MAY_BE_LEFT_OUT = "Some may still be held.";
const CHOICE_CLASSES = ["dd-create", "dd-panel-action"];

function choicesOf(file: NoteRef, name: string, tracking: ItemTracking): ViewElement {
  const buttons: ViewElement[] = [];
  for (const choice of SETTLE_CHOICES) buttons.push(new ActionButton(choice.label, CHOICE_CLASSES, new SettleRun(file, name, choice, tracking)).build());
  return new Div({ cls: ["dd-panel-choices"] }, buttons);
}

function mayBeLeftOut(leftOut: LeftOutCounts | null): ViewElement[] {
  if (leftOut === null || !hasLeftOut(leftOut)) return [];
  return [new Paragraph({ cls: ["dd-note", "dd-may-be-left-out"], text: MAY_BE_LEFT_OUT })];
}

export function heldButNotImported(file: NoteRef, held: readonly HeldItem[], leftOut: LeftOutCounts | null, tracking: ItemTracking): ViewElement[] {
  if (held.length === 0) return [];
  const lines: ViewElement[] = [];
  for (const item of held) lines.push(panelLine(item.shown, [choicesOf(file, item.name, tracking)]));
  return [
    new Heading3({ cls: ["dd-holder"], text: HELD_NOT_IMPORTED }),
    new Paragraph({ cls: ["dd-note"], text: PICK_WHAT_HAPPENED }),
    ...mayBeLeftOut(leftOut),
    new List({ cls: ["dd-list", "dd-held-not-imported"] }, lines),
  ];
}
