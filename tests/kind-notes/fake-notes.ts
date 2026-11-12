import { vi } from "vitest";
import type { CachedMetadata, TFile } from "obsidian";
import { getFrontMatterInfo, TFile as StubFile } from "../stubs/obsidian";

export type Properties = Record<string, unknown>;

interface Note {
  file: TFile;
  properties: Properties | null;
  words: string;
}

function nameOf(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

export function fileAt(path: string): TFile {
  const name = nameOf(path);
  const dot = name.lastIndexOf(".");
  return Object.assign(new StubFile(), { path, name, basename: name.slice(0, dot), extension: name.slice(dot + 1) }) as unknown as TFile;
}

function textOf(note: Note): string {
  if (note.properties === null) return note.words;
  const lines = Object.entries(note.properties).map(([key, value]) => `${key}: ${JSON.stringify(value)}\n`);
  return `---\n${lines.join("")}---\n${note.words}`;
}

function propertyOf(line: string): [string, unknown] {
  const colon = line.indexOf(": ");
  return [line.slice(0, colon), JSON.parse(line.slice(colon + 2))];
}

function propertiesIn(text: string): Properties | null {
  const info = getFrontMatterInfo(text);
  if (!info.exists) return null;
  const entries = info.frontmatter.split("\n").filter((line) => line !== "");
  return Object.fromEntries(entries.map(propertyOf));
}

function firstOf(files: TFile[]): TFile | null {
  const [first] = files;
  if (first === undefined) return null;
  return first;
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
  alsoChangeWords: string | null = null;
  typedBeforePutBack: string | null = null;
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

  addNote(path: string, properties: Properties | null, words: string): TFile {
    const file = fileAt(path);
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
    read: vi.fn(async (file: TFile) => textOf(this.noteOf(file))),
    process: vi.fn(async (file: TFile, change: (text: string) => string) => {
      this.processed.push(file.path);
      if (this.typedBeforePutBack !== null) this.noteOf(file).words = this.typedBeforePutBack;
      const text = change(textOf(this.noteOf(file)));
      const note = this.noteOf(file);
      note.properties = propertiesIn(text);
      note.words = text.slice(getFrontMatterInfo(text).contentStart);
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
      const campaign = source.slice(0, source.indexOf("/", source.indexOf("/") + 1));
      const named = this.sessions.filter((session) => session.path === `${target}.md` || session.basename === target);
      const inCampaign = named.filter((session) => session.path.startsWith(`${campaign}/`));
      if (inCampaign.length > 0) return firstOf(inCampaign);
      return firstOf(named);
    }),
  };

  needs() {
    return { files: this.files, metadata: this.metadata, actions: this.actions, say: (message: string) => this.said.push(message) };
  }

  private fileAt(path: string): TFile | null {
    const note = this.notes.get(path);
    if (note !== undefined) return note.file;
    return firstOf(this.sessions.filter((session) => session.path === path));
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
