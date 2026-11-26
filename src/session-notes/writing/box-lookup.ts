import type { Campaign } from "../../campaign/record/campaign";
import { lookupMatches, readLookup, type Lookup } from "../../lookups/lookup";
import { lookupHeadingOf } from "../../lookups/lookup-heading";
import { lineAt, type BoxLine } from "./box-text";
import type { LookupList } from "./lookup-list";
import type { PressedKey } from "../../views/elements/bindings/binding-wiring";

export interface BoxState {
  readonly text: string;
  readonly caret: number;
}

type KeyAction = (list: LookupList) => void;

function moveDown(list: LookupList): void {
  list.move(1);
}

function moveUp(list: LookupList): void {
  list.move(-1);
}

function pickSelected(list: LookupList): void {
  list.pickSelected();
}

const KEY_ACTIONS = new Map<string, KeyAction>([
  ["ArrowDown", moveDown],
  ["ArrowUp", moveUp],
  ["Enter", pickSelected],
]);

function isSameLine(first: BoxLine | null, second: BoxLine): boolean {
  if (first === null) return false;
  return first.index === second.index && first.text === second.text;
}

export class BoxLookup {
  private dismissedLine: BoxLine | null = null;
  private shownLine: BoxLine | null = null;

  constructor(
    private readonly box: BoxState,
    private readonly list: LookupList,
    private readonly campaign: () => Campaign,
  ) {}

  currentLine(): BoxLine {
    return lineAt(this.box.text, this.box.caret);
  }

  refresh(): void {
    const line = this.currentLine();
    if (this.list.isOpen && isSameLine(this.shownLine, line)) return;
    const lookup = readLookup(line.text);
    if (lookup === null || this.isDismissed(line)) {
      this.close();
      return;
    }
    this.shownLine = line;
    this.showMatches(lookup);
  }

  keyDown(pressed: PressedKey): void {
    if (!this.list.isOpen || pressed.modified) return;
    if (pressed.key === "Escape") {
      this.dismiss(pressed);
      return;
    }
    const action = KEY_ACTIONS.get(pressed.key);
    if (action === undefined) return;
    pressed.handled();
    action(this.list);
  }

  close(): void {
    this.shownLine = null;
    this.list.close();
  }

  private showMatches(lookup: Lookup): void {
    const campaign = this.campaign();
    const matches = lookupMatches(campaign, lookup);
    const open = lookupMatches(campaign, { kind: lookup.kind, keywords: [] }).length;
    this.list.show(lookupHeadingOf(lookup, { matching: matches.length, open }), matches, lookup.keywords);
  }

  private dismiss(pressed: PressedKey): void {
    pressed.keptHere();
    this.dismissedLine = this.currentLine();
    this.close();
  }

  private isDismissed(line: BoxLine): boolean {
    if (isSameLine(this.dismissedLine, line)) return true;
    this.dismissedLine = null;
    return false;
  }
}
