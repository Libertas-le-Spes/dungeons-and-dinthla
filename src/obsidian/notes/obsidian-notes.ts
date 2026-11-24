import type { CachedMetadata, EventRef, TAbstractFile, TFile } from "obsidian";
import type { GoneFile } from "../../fence/gate/fenced-files";
import type { Gatekeeper } from "../../fence/gate/gatekeeper";
import type { HostNotes } from "../../host/host";
import type { LinkCounts, LinkLookup } from "../../host/notes/link-lookup";
import type { NoteChanges, Stop } from "../../host/notes/note-changes";
import type { LinkFact, NoteFacts, Properties, PropertyLinkFact } from "../../host/notes/note-facts";
import type { ChangeProperties, NoteKeeping } from "../../host/notes/note-keeping";
import type { NoteRef } from "../../host/notes/note-ref";
import type { NoteEdit, NoteStore } from "../../host/notes/note-store";
import { deletesPermanently } from "./trash-option";

type Gate = Pick<Gatekeeper, "files" | "fileActions" | "metadata" | "vaultSettings">;

export const KEPT_HERE_ONLY = "Only notes the gate handed out can be used here.";

interface CachedLink {
  readonly link: string;
  readonly position: { readonly start: { readonly line: number } };
}

function linkFactsOf(links: readonly CachedLink[] | undefined): LinkFact[] {
  const facts: LinkFact[] = [];
  if (links === undefined) return facts;
  for (const link of links) facts.push({ linkText: link.link, line: link.position.start.line });
  return facts;
}

function isNote(file: TAbstractFile): file is TFile {
  return "basename" in file && "stat" in file;
}

class HeardNote {
  constructor(private readonly heard: (note: NoteRef) => void) {}

  file(file: TAbstractFile): void {
    if (isNote(file)) this.heard(file);
  }

  read(file: TFile): void {
    this.heard(file);
  }
}

class HeardRead {
  constructor(private readonly heard: (note: NoteRef, text: string) => void) {}

  read(file: TFile, text: string): void {
    this.heard(file, text);
  }
}

class HeardGone {
  constructor(private readonly heard: (path: string) => void) {}

  file(file: GoneFile): void {
    this.heard(file.path);
  }
}

class HeardMove {
  constructor(private readonly heard: (note: NoteRef, oldPath: string) => void) {}

  file(file: TAbstractFile, oldPath: string): void {
    if (isNote(file)) this.heard(file, oldPath);
  }
}

class HeardFolderMove {
  constructor(private readonly heard: (path: string, oldPath: string) => void) {}

  file(file: TAbstractFile, oldPath: string): void {
    if (!isNote(file)) this.heard(file.path, oldPath);
  }
}

class Stopper {
  constructor(
    private readonly offref: (ref: EventRef) => void,
    private readonly ref: EventRef,
  ) {}

  stop(): void {
    this.offref(this.ref);
  }
}

export class ObsidianNotes implements HostNotes, NoteStore, NoteKeeping, NoteChanges, NoteFacts, LinkLookup {
  readonly store = this;
  readonly keeping = this;
  readonly changes = this;
  readonly facts = this;
  readonly links = this;

  constructor(private readonly gate: Gate) {}

  note(path: string): NoteRef | null {
    return this.gate.files.getFileByPath(path);
  }

  notes(): NoteRef[] {
    return this.gate.files.getMarkdownFiles();
  }

  files(): NoteRef[] {
    return this.gate.files.getFiles();
  }

  notesUnder(folder: string): NoteRef[] {
    return this.gate.files.markdownFilesUnder(folder);
  }

  hasFolder(path: string): boolean {
    return this.gate.files.getFolderByPath(path) !== null;
  }

  namesIn(folder: string): string[] {
    return this.gate.files.namesIn(folder);
  }

  read(note: NoteRef): Promise<string> {
    return this.gate.files.read(this.fileOf(note));
  }

  readKept(note: NoteRef): Promise<string> {
    return this.gate.files.cachedRead(this.fileOf(note));
  }

  change(note: NoteRef, edit: NoteEdit): Promise<string> {
    return this.gate.files.process(this.fileOf(note), edit);
  }

  make(path: string, text: string): Promise<NoteRef> {
    return this.gate.files.create(path, text);
  }

  async makeFolder(path: string): Promise<void> {
    await this.gate.files.createFolder(path);
  }

  removeEmptyFolder(path: string): Promise<void> {
    return this.gate.files.removeEmptyFolder(path);
  }

  move(note: NoteRef, newPath: string): Promise<void> {
    return this.gate.files.rename(this.fileOf(note), newPath);
  }

  changedAt(note: NoteRef): number {
    return this.fileOf(note).stat.mtime;
  }

  moveWithLinks(note: NoteRef, newPath: string): Promise<void> {
    return this.gate.fileActions.renameFile(this.fileOf(note), newPath);
  }

  throwAway(note: NoteRef): Promise<void> {
    return this.gate.fileActions.trashFile(this.fileOf(note));
  }

  throwsAwayForGood(): boolean {
    return deletesPermanently(this.gate.vaultSettings);
  }

  changeProperties(note: NoteRef, change: ChangeProperties): Promise<void> {
    return this.gate.fileActions.processFrontMatter(this.fileOf(note), change);
  }

  onMade(heard: (note: NoteRef) => void): Stop {
    const listener = new HeardNote(heard);
    return this.stopperOf(this.gate.files.on("create", listener.file.bind(listener)));
  }

  onChanged(heard: (note: NoteRef) => void): Stop {
    const listener = new HeardNote(heard);
    return this.stopperOf(this.gate.files.on("modify", listener.file.bind(listener)));
  }

  onGone(heard: (path: string) => void): Stop {
    const listener = new HeardGone(heard);
    return this.stopperOf(this.gate.files.on("delete", listener.file.bind(listener)));
  }

  onMoved(heard: (note: NoteRef, oldPath: string) => void): Stop {
    const listener = new HeardMove(heard);
    return this.stopperOf(this.gate.files.on("rename", listener.file.bind(listener)));
  }

  onFolderMoved(heard: (path: string, oldPath: string) => void): Stop {
    const listener = new HeardFolderMove(heard);
    return this.stopperOf(this.gate.files.on("rename", listener.file.bind(listener)));
  }

  onRead(heard: (note: NoteRef, text: string) => void): Stop {
    const listener = new HeardRead(heard);
    return this.metadataStopperOf(this.gate.metadata.on("changed", listener.read.bind(listener)));
  }

  onLinksSettled(heard: (note: NoteRef) => void): Stop {
    const listener = new HeardNote(heard);
    return this.metadataStopperOf(this.gate.metadata.on("resolve", listener.read.bind(listener)));
  }

  propertiesOf(note: NoteRef): Properties | null {
    const cache = this.cacheOf(note);
    if (cache === null) return null;
    if (cache.frontmatter === undefined) return {};
    return cache.frontmatter;
  }

  linksIn(note: NoteRef): LinkFact[] {
    return linkFactsOf(this.cacheOf(note)?.links);
  }

  embedsIn(note: NoteRef): LinkFact[] {
    return linkFactsOf(this.cacheOf(note)?.embeds);
  }

  propertyLinksIn(note: NoteRef): PropertyLinkFact[] {
    const facts: PropertyLinkFact[] = [];
    const links = this.cacheOf(note)?.frontmatterLinks;
    if (links === undefined) return facts;
    for (const link of links) facts.push({ key: link.key, linkText: link.link });
    return facts;
  }

  target(linkText: string, fromPath: string): NoteRef | null {
    return this.gate.metadata.getFirstLinkpathDest(linkText, fromPath);
  }

  linkTextTo(note: NoteRef, fromPath: string, withoutEnding: boolean): string {
    return this.gate.metadata.fileToLinktext(this.fileOf(note), fromPath, withoutEnding);
  }

  unresolvedIn(path: string): string[] {
    return this.gate.metadata.unresolvedLinksOf(path);
  }

  linkCounts(): LinkCounts {
    return this.gate.metadata.resolvedLinks;
  }

  private cacheOf(note: NoteRef): CachedMetadata | null {
    return this.gate.metadata.getFileCache(this.fileOf(note));
  }

  private fileOf(note: NoteRef): TFile {
    const file = this.gate.files.getFileByPath(note.path);
    if (file === null || file !== note) throw new Error(KEPT_HERE_ONLY);
    return file;
  }

  private stopperOf(ref: EventRef): Stop {
    const stopper = new Stopper(this.gate.files.offref.bind(this.gate.files), ref);
    return stopper.stop.bind(stopper);
  }

  private metadataStopperOf(ref: EventRef): Stop {
    const stopper = new Stopper(this.gate.metadata.offref.bind(this.gate.metadata), ref);
    return stopper.stop.bind(stopper);
  }
}
