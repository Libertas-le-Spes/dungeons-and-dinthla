import type { Campaign } from "../../campaign/record/campaign";
import { lookupMatches, readLookup, type Lookup } from "../../lookups/lookup";
import { lookupHeadingOf } from "../../lookups/lookup-heading";
import { lineAt, type BoxLine } from "./box-text";
import type { LookupList } from "./lookup-list";

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

function hasModifier(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
}

function isSameLine(first: BoxLine | null, second: BoxLine): boolean {
  if (first === null) return false;
  return first.index === second.index && first.text === second.text;
}

export class BoxLookup {
  private dismissedLine: BoxLine | null = null;
  private shownLine: BoxLine | null = null;

  constructor(
    private readonly textarea: HTMLTextAreaElement,
    private readonly list: LookupList,
    private readonly campaign: () => Campaign,
  ) {}

  currentLine(): BoxLine {
    return lineAt(this.textarea.value, this.textarea.selectionStart);
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

  keyDown(event: KeyboardEvent): void {
    if (!this.list.isOpen || hasModifier(event)) return;
    if (event.key === "Escape") {
      this.dismiss(event);
      return;
    }
    const action = KEY_ACTIONS.get(event.key);
    if (action === undefined) return;
    event.preventDefault();
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

  private dismiss(event: KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dismissedLine = this.currentLine();
    this.close();
  }

  private isDismissed(line: BoxLine): boolean {
    if (isSameLine(this.dismissedLine, line)) return true;
    this.dismissedLine = null;
    return false;
  }
}
