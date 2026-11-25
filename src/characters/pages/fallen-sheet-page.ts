import type { NoteRef } from "../../host/notes/note-ref";
import type { LinkOpener } from "../../views/components/rows/link-name";
import { PendingWork } from "../../views/pending/pending-work";
import type { CharacterSheet, SheetValue } from "../reading/character-sheet";
import { readCharacterSheet, type ReadSheet, type SheetStore } from "../reading/read-character-sheet";
import type { SheetNotes } from "../reading/sheet-notes";
import { leftPlayLinesOf } from "../reading/left-play-lines";
import { modifierOf } from "../reading/sheet-values";
import { makeMainButton, type MakeMainAction } from "../cards/drawing/make-main-button";
import { couldNotRead } from "./character-sheet-page";
import { shownTextOf } from "../reading/sheet-value-words";
import { leftPlaySection } from "./left-play-section";
import { HandleRequest } from "../../views/elements/bindings/bindings";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { Bold, Div, Heading1, Paragraph, Span } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import type { PagePart } from "../../views/pages/page-part";
import type { PropertiesSyntax } from "../../campaign/paths/session-file";

type WatchedStore = SheetStore & { subscribe(listener: () => void): () => void };

export interface FallenNeeds {
  readonly store: WatchedStore;
  readonly notes: SheetNotes;
  readonly links: LinkOpener;
  readonly makeMain: MakeMainAction;
  leave(): void;
}

interface FallenRead {
  readonly read: ReadSheet;
  readonly lines: string[];
}

function subtitleOf(sheet: CharacterSheet): SheetValue | null {
  for (const value of sheet.values) {
    if (value.name === "subtitle" && value.state !== "unknown") return value;
  }
  return null;
}

const FALLEN_SHEET_CLASSES = ["dd-tokens", "dd-root", "dd-list-view", "dd-sheet", "dd-fallen-sheet"];

function abilityOf(value: SheetValue): ViewElement {
  const shown = shownTextOf(value);
  const line: ViewElement[] = [new Span({ cls: ["dd-value-read", `dd-state-${value.state}`], text: shown })];
  const modifier = modifierOf(shown);
  if (modifier !== "") line.push(new Span({ cls: ["dd-modifier"], text: `(${modifier})` }));
  return new Div({ cls: ["dd-sheet-ability"] }, [new Bold({ text: value.label }), new Div({ cls: ["dd-value-line"] }, line)]);
}

export class FallenSheetPage implements PagePart {
  private renders = 0;
  private readonly shownPath: string;
  private readonly drawing = new PendingWork();
  private readonly place = new KeptHandle();
  private readonly stops: (() => void)[] = [];

  constructor(
    private readonly file: NoteRef,
    private readonly needs: FallenNeeds,
    private readonly syntax: PropertiesSyntax,
  ) {
    this.shownPath = file.path;
  }

  tree(): ViewElement {
    return new Div({ cls: FALLEN_SHEET_CLASSES, bindings: [new HandleRequest(this.place)] });
  }

  started(): void {
    this.stops.push(this.needs.store.subscribe(this.refresh.bind(this)));
    this.stops.push(this.needs.notes.onNoteChanged(this.refreshIfShown.bind(this)));
    this.stops.push(this.needs.notes.onNoteMoved(this.leaveIfMoved.bind(this)));
    this.refresh();
  }

  stopped(): void {
    this.renders += 1;
    for (const stop of this.stops) stop();
    this.stops.length = 0;
    this.place.showInside([]);
  }

  async rendered(): Promise<void> {
    await this.drawing.settled();
  }

  private refresh(): void {
    this.drawing.add(this.render());
  }

  private refreshIfShown(path: string): void {
    if (path === this.shownPath) this.refresh();
  }

  private leaveIfMoved(path: string): void {
    if (path === this.shownPath) this.needs.leave();
  }

  private async readFallen(): Promise<FallenRead> {
    const read = await readCharacterSheet(this.file, this.needs.store, this.needs.notes, this.syntax);
    const text = await this.needs.notes.textOf(this.file);
    return { read, lines: leftPlayLinesOf(text) };
  }

  private async render(): Promise<void> {
    const render = ++this.renders;
    let fallen: FallenRead;
    try {
      fallen = await this.readFallen();
    } catch (error) {
      if (render !== this.renders) return;
      this.place.showInside([this.headOf(), new Paragraph({ cls: ["dd-empty"], text: couldNotRead(this.file, error) })]);
      return;
    }
    if (render !== this.renders) return;
    this.draw(fallen);
  }

  private headOf(): ViewElement {
    const actions = new Div({ cls: ["dd-head-actions"] }, [makeMainButton(this.file.path, this.needs.makeMain)]);
    return new Div({ cls: ["dd-head"] }, [new Heading1({ cls: ["dd-sheet-name"], text: this.file.basename }), actions]);
  }

  private draw(fallen: FallenRead): void {
    const sheet = fallen.read.sheet;
    const trees: ViewElement[] = [this.headOf()];
    const subtitle = subtitleOf(sheet);
    if (subtitle !== null) trees.push(new Paragraph({ cls: ["dd-sheet-subtitle"], text: shownTextOf(subtitle) }));
    const abilities: ViewElement[] = [];
    for (const value of sheet.abilities) abilities.push(abilityOf(value));
    trees.push(new Div({ cls: ["dd-sheet-abilities"] }, abilities));
    trees.push(leftPlaySection(fallen.lines, { sourcePath: this.file.path, opener: this.needs.links }));
    this.place.showInside(trees);
  }
}
