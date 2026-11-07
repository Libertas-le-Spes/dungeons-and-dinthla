import type { CachedMetadata, TFile } from "obsidian";
import type { CampaignMetadata, CampaignVault } from "../../src/campaign/read-campaign";

export interface FakeNote {
  path: string;
  text: string;
  propertiesEndLine?: number;
}

function fileFor(path: string): TFile {
  const folder = path.slice(0, path.lastIndexOf("/"));
  const name = path.slice(path.lastIndexOf("/") + 1);
  const extension = name.slice(name.lastIndexOf(".") + 1);
  const basename = name.slice(0, name.lastIndexOf("."));
  return { path, basename, extension, parent: { path: folder } } as TFile;
}

export function cacheWithProperties(endLine: number | undefined): CachedMetadata {
  if (endLine === undefined) return {};
  return { frontmatterPosition: { start: { line: 0 }, end: { line: endLine } } } as CachedMetadata;
}

export class FakeVault {
  readonly notes: FakeNote[];

  constructor(notes: FakeNote[]) {
    this.notes = [...notes];
  }

  get vault(): CampaignVault {
    return {
      getFiles: () => this.notes.map((note) => fileFor(note.path)),
      cachedRead: async (file) => this.noteAt(file.path).text,
      getFileByPath: (path) => {
        if (!this.notes.some((note) => note.path === path)) return null;
        return fileFor(path);
      },
    };
  }

  get metadata(): CampaignMetadata {
    return { getFileCache: (file) => cacheWithProperties(this.noteAt(file.path).propertiesEndLine) };
  }

  file(path: string): TFile {
    return fileFor(path);
  }

  rename(oldPath: string, path: string): void {
    this.noteAt(oldPath).path = path;
  }

  private noteAt(path: string): FakeNote {
    const note = this.notes.find((candidate) => candidate.path === path);
    if (note === undefined) throw new Error(`No note at ${path}`);
    return note;
  }
}
