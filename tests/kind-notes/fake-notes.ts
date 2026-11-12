import { vi } from "vitest";
import type { CachedMetadata, TFile } from "obsidian";
import { HALF_MADE_AFTER_MS } from "../../src/kind-notes/keeping/kind-note-keeper";
import { wordsOf } from "../../src/note-keeping/note-words";
import { fileAt, nameOf, type Properties } from "../stubs/note-files";
import { getFrontMatterInfo } from "../stubs/obsidian";

export { fileAt, type Properties };

interface Note {
  file: TFile;
  properties: Properties | null;
  words: string;
}

function firstOrNull(files: TFile[]): TFile | null {
  const [first] = files;
  if (first === undefined) return null;
  return first;
}

function textOf(note: Note): string {
  if (note.properties === null) return note.words;
  const lines = Object.entries(note.properties).map(([key, value]) => `${key}: ${JSON.stringify(value)}\n`);
  return `---\n${lines.join("")}---\n${note.words}`;
}

const PROPERTY_LINE = /^([^:]+): (.*)$/;

function propertyOf(line: string): [string, unknown] {
  const match = PROPERTY_LINE.exec(line);
  if (match === null) throw new Error(`${line} isn't a property line`);
  const [, key, value] = match;
  return [String(key), JSON.parse(String(value))];
}

function propertiesIn(text: string): Properties | null {
  const info = getFrontMatterInfo(text);
  if (!info.exists) return null;
  const entries = info.frontmatter.split("\n").filter((line) => line !== "");
  return Object.fromEntries(entries.map(propertyOf));
}

export class FakeNotes {
  readonly created: string[] = [];
  readonly foldersMade: string[] = [];
  readonly propertyWrites: { path: string; properties: Properties }[] = [];
  readonly trashed: string[] = [];
  readonly processed: string[] = [];
  readonly said: string[] = [];
  readonly unread = new Set<string>();
  readonly folders = new Set<string>();
  failProperties: Error | null = null;
  failReadOnce: Error | null = null;
  readonly clock = 10 * HALF_MADE_AFTER_MS;
  failRename: Error | null = null;
  failRenamesFrom: number | null = null;
  private renameCalls = 0;
  alsoChangeWords: string | null = null;
  holdProperties: Promise<void> = Promise.resolve();
  inside = 0;
  mostInside = 0;
  private readonly notes = new Map<string, Note>();
  private readonly sessions: TFile[] = [];

  addSession(path: string): TFile {
    const file = fileAt(path);
    this.sessions.push(file);
    return file;
  }

  removeSession(path: string): void {
    const index = this.sessions.findIndex((session) => session.path === path);
    this.sessions.splice(index, 1);
  }

  addNote(path: string, properties: Properties | null, words: string, mtime = 0): TFile {
    const file = fileAt(path, mtime);
    this.notes.set(path, { file, properties, words });
    return file;
  }

  noteAt(path: string): { properties: Properties | null; words: string; text: string } | null {
    const note = this.notes.get(path);
    if (note === undefined) return null;
    return { properties: note.properties, words: note.words, text: textOf(note) };
  }

  readonly files = {
    getFileByPath: vi.fn((path: string) => this.fileAt(path)),
    getFolderByPath: vi.fn((path: string) => this.folderAt(path)),
    createFolder: vi.fn(async (path: string) => {
      this.foldersMade.push(path);
      this.folders.add(path);
      return { path } as never;
    }),
    create: vi.fn(async (path: string, text: string) => {
      this.created.push(path);
      return this.addNote(path, null, text);
    }),
    read: vi.fn(async (file: TFile) => this.readOf(file)),
    rename: vi.fn(async (file: TFile, newPath: string) => this.renamed(file, newPath)),
    process: vi.fn(async (file: TFile, change: (text: string) => string) => {
      this.processed.push(file.path);
      const text = change(textOf(this.noteOf(file)));
      const note = this.noteOf(file);
      note.properties = propertiesIn(text);
      note.words = wordsOf(text);
      return text;
    }),
  };

  readonly actions = {
    processFrontMatter: vi.fn(async (file: TFile, change: (properties: Properties) => void) => {
      this.inside += 1;
      this.mostInside = Math.max(this.mostInside, this.inside);
      await this.holdProperties;
      this.inside -= 1;
      if (this.failProperties !== null) throw this.failProperties;
      const note = this.noteOf(file);
      const properties = { ...note.properties };
      change(properties);
      note.properties = properties;
      if (this.alsoChangeWords !== null) note.words = this.alsoChangeWords;
      this.propertyWrites.push({ path: file.path, properties });
    }),
    trashFile: vi.fn(async (file: TFile) => {
      this.trashed.push(file.path);
      this.notes.delete(file.path);
    }),
  };

  readonly metadata = {
    getFileCache: vi.fn((file: TFile): CachedMetadata | null => {
      if (this.unread.has(file.path)) return null;
      const note = this.noteOf(file);
      if (note.properties === null) return {};
      return { frontmatter: { ...note.properties } } as CachedMetadata;
    }),
    fileToLinktext: vi.fn((file: TFile) => {
      const shared = this.sessions.filter((session) => session.name === file.name);
      if (shared.length > 1) return file.path.replace(/\.md$/, "");
      return file.basename;
    }),
    getFirstLinkpathDest: vi.fn((target: string, source: string): TFile | null => {
      const [top, name] = source.split("/");
      const campaign = `${top}/${name}`;
      const named = this.sessions.filter((session) => session.path === `${target}.md` || session.basename === target);
      const inCampaign = named.filter((session) => session.path.startsWith(`${campaign}/`));
      if (inCampaign.length > 0) return firstOrNull(inCampaign);
      return firstOrNull(named);
    }),
  };

  needs() {
    return { files: this.files, metadata: this.metadata, actions: this.actions, now: () => this.clock, say: (message: string) => this.said.push(message) };
  }

  private renamed(file: TFile, newPath: string): void {
    this.renameCalls += 1;
    if (this.failRename !== null) throw this.failRename;
    if (this.failRenamesFrom !== null && this.renameCalls >= this.failRenamesFrom) throw new Error("can't move back");
    const note = this.notes.get(file.path);
    if (note !== undefined) {
      this.notes.delete(file.path);
      this.notes.set(newPath, note);
    }
    Object.assign(file, { path: newPath, name: nameOf(newPath), basename: nameOf(newPath).replace(/\.md$/, "") });
  }

  private readOf(file: TFile): string {
    if (this.failReadOnce !== null) {
      const failure = this.failReadOnce;
      this.failReadOnce = null;
      throw failure;
    }
    return textOf(this.noteOf(file));
  }

  private fileAt(path: string): TFile | null {
    const note = this.notes.get(path);
    if (note !== undefined) return note.file;
    return firstOrNull(this.sessions.filter((session) => session.path === path));
  }

  private folderAt(path: string): never | null {
    if (!this.folders.has(path)) return null;
    return { path } as never;
  }

  private noteOf(file: TFile): Note {
    const note = this.notes.get(file.path);
    if (note === undefined) throw new Error(`no note at ${file.path}`);
    return note;
  }
}
