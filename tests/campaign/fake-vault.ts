import type { TFile } from "obsidian";
import type { CampaignVault } from "../../src/campaign/read-campaign";

export interface FakeNote {
  path: string;
  text: string;
}

function fileFor(path: string): TFile {
  const name = path.slice(path.lastIndexOf("/") + 1);
  const basename = name.slice(0, name.lastIndexOf("."));
  return { path, basename } as TFile;
}

export class FakeVault {
  private readonly notes: FakeNote[];
  private readonly held = new Map<string, Promise<void>>();

  constructor(notes: FakeNote[]) {
    this.notes = notes.map((note) => ({ ...note }));
  }

  get vault(): CampaignVault {
    return {
      getFiles: () => this.notes.map((note) => fileFor(note.path)),
      cachedRead: async (file) => {
        const text = this.noteAt(file.path).text;
        await this.held.get(file.path);
        return text;
      },
      getFileByPath: (path) => {
        if (!this.notes.some((note) => note.path === path)) return null;
        return fileFor(path);
      },
    };
  }

  holdReadsOf(path: string): () => void {
    let release = (): void => {};
    this.held.set(
      path,
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    return () => {
      this.held.delete(path);
      release();
    };
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
