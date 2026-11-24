import type { HostNotes } from "../../src/host/host";
import type { LinkCounts, LinkLookup } from "../../src/host/notes/link-lookup";
import type { NoteChanges, Stop } from "../../src/host/notes/note-changes";
import type { LinkFact, NoteFacts, Properties, PropertyLinkFact } from "../../src/host/notes/note-facts";
import type { ChangeProperties, NoteKeeping } from "../../src/host/notes/note-keeping";
import type { NoteRef } from "../../src/host/notes/note-ref";
import type { NoteEdit, NoteStore } from "../../src/host/notes/note-store";

class MemoryNote implements NoteRef {
  constructor(public path: string) {}

  get basename(): string {
    const name = this.path.slice(this.path.lastIndexOf("/") + 1);
    return name.replace(/\.md$/, "");
  }
}

type Heard<Args extends unknown[]> = (...args: Args) => void;

class Listeners<Args extends unknown[]> {
  private readonly heard = new Set<Heard<Args>>();

  add(heard: Heard<Args>): Stop {
    this.heard.add(heard);
    return this.heard.delete.bind(this.heard, heard) as Stop;
  }

  tell(...args: Args): void {
    for (const heard of this.heard) heard(...args);
  }
}

export class InMemoryNotes implements HostNotes, NoteStore, NoteKeeping, NoteChanges, NoteFacts, LinkLookup {
  readonly store = this;
  readonly keeping = this;
  readonly changes = this;
  readonly facts = this;
  readonly links = this;
  readonly texts = new Map<string, string>();
  readonly folders = new Set<string>();
  readonly trashed: string[] = [];
  readonly properties = new Map<string, Record<string, unknown>>();
  private readonly handles = new Map<string, MemoryNote>();
  private readonly times = new Map<string, number>();
  private readonly made = new Listeners<[NoteRef]>();
  private readonly changedNotes = new Listeners<[NoteRef]>();
  private readonly gone = new Listeners<[string]>();
  private readonly moved = new Listeners<[NoteRef, string]>();
  private readonly foldersMoved = new Listeners<[string, string]>();
  private readonly read_ = new Listeners<[NoteRef, string]>();
  private readonly settled = new Listeners<[NoteRef]>();
  forGood = false;

  put(path: string, text: string): NoteRef {
    this.texts.set(path, text);
    return this.handleOf(path);
  }

  note(path: string): NoteRef | null {
    if (!this.texts.has(path)) return null;
    return this.handleOf(path);
  }

  notes(): NoteRef[] {
    const found: NoteRef[] = [];
    for (const path of this.texts.keys()) {
      if (path.endsWith(".md")) found.push(this.handleOf(path));
    }
    return found;
  }

  files(): NoteRef[] {
    const found: NoteRef[] = [];
    for (const path of this.texts.keys()) found.push(this.handleOf(path));
    return found;
  }

  notesUnder(folder: string): NoteRef[] {
    const found: NoteRef[] = [];
    for (const note of this.notes()) {
      if (note.path.startsWith(`${folder}/`)) found.push(note);
    }
    return found;
  }

  hasFolder(path: string): boolean {
    return this.folders.has(path);
  }

  namesIn(folder: string): string[] {
    const names = new Set<string>();
    for (const path of [...this.texts.keys(), ...this.folders]) {
      if (!path.startsWith(`${folder}/`)) continue;
      const [name] = path.slice(folder.length + 1).split("/");
      if (name !== undefined) names.add(name);
    }
    return [...names];
  }

  async read(note: NoteRef): Promise<string> {
    return this.textOf(note);
  }

  async readKept(note: NoteRef): Promise<string> {
    return this.textOf(note);
  }

  async change(note: NoteRef, edit: NoteEdit): Promise<string> {
    const next = edit(this.textOf(note));
    this.texts.set(note.path, next);
    this.changedNotes.tell(note);
    return next;
  }

  async make(path: string, text: string): Promise<NoteRef> {
    if (this.texts.has(path)) throw new Error(`${path} is already there.`);
    const made = this.put(path, text);
    this.made.tell(made);
    return made;
  }

  async makeFolder(path: string): Promise<void> {
    this.folders.add(path);
  }

  async removeEmptyFolder(path: string): Promise<void> {
    this.folders.delete(path);
  }

  async move(note: NoteRef, newPath: string): Promise<void> {
    this.rename(note, newPath);
  }

  changedAt(note: NoteRef): number {
    const time = this.times.get(note.path);
    if (time === undefined) return 0;
    return time;
  }

  async moveWithLinks(note: NoteRef, newPath: string): Promise<void> {
    this.rename(note, newPath);
  }

  readBack(note: NoteRef): void {
    this.read_.tell(note, this.textOf(note));
  }

  moveFolder(oldPath: string, path: string): void {
    this.foldersMoved.tell(path, oldPath);
  }

  async throwAway(note: NoteRef): Promise<void> {
    this.texts.delete(note.path);
    this.handles.delete(note.path);
    this.trashed.push(note.path);
    this.gone.tell(note.path);
  }

  throwsAwayForGood(): boolean {
    return this.forGood;
  }

  async changeProperties(note: NoteRef, change: ChangeProperties): Promise<void> {
    const properties = { ...this.properties.get(note.path) };
    change(properties);
    this.properties.set(note.path, properties);
  }

  onMade(heard: Heard<[NoteRef]>): Stop {
    return this.made.add(heard);
  }

  onChanged(heard: Heard<[NoteRef]>): Stop {
    return this.changedNotes.add(heard);
  }

  onGone(heard: Heard<[string]>): Stop {
    return this.gone.add(heard);
  }

  onMoved(heard: Heard<[NoteRef, string]>): Stop {
    return this.moved.add(heard);
  }

  onFolderMoved(heard: Heard<[string, string]>): Stop {
    return this.foldersMoved.add(heard);
  }

  onRead(heard: Heard<[NoteRef, string]>): Stop {
    return this.read_.add(heard);
  }

  onLinksSettled(heard: Heard<[NoteRef]>): Stop {
    return this.settled.add(heard);
  }

  propertiesOf(note: NoteRef): Properties | null {
    if (!this.texts.has(note.path)) return null;
    const properties = this.properties.get(note.path);
    if (properties === undefined) return {};
    return properties;
  }

  linksIn(): LinkFact[] {
    return [];
  }

  embedsIn(): LinkFact[] {
    return [];
  }

  propertyLinksIn(): PropertyLinkFact[] {
    return [];
  }

  target(linkText: string): NoteRef | null {
    for (const note of this.notes()) {
      if (note.basename === linkText || note.path === linkText) return note;
    }
    return null;
  }

  linkTextTo(note: NoteRef): string {
    return note.basename;
  }

  unresolvedIn(): string[] {
    return [];
  }

  linkCounts(): LinkCounts {
    return {};
  }

  private textOf(note: NoteRef): string {
    const text = this.texts.get(note.path);
    if (text === undefined) throw new Error(`${note.path} isn't there.`);
    return text;
  }

  private handleOf(path: string): MemoryNote {
    const known = this.handles.get(path);
    if (known !== undefined) return known;
    const made = new MemoryNote(path);
    this.handles.set(path, made);
    return made;
  }

  private rename(note: NoteRef, newPath: string): void {
    const text = this.textOf(note);
    const handle = this.handleOf(note.path);
    const oldPath = note.path;
    this.texts.delete(oldPath);
    this.handles.delete(oldPath);
    handle.path = newPath;
    this.texts.set(newPath, text);
    this.handles.set(newPath, handle);
    this.moved.tell(handle, oldPath);
  }
}
