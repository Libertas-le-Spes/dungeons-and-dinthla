import type { TFile } from "obsidian";
import type { MentionNotes } from "../../src/characters/reading/mention-notes";

export interface FakeMentionSetup {
  campaignFolders: string[];
  links: Record<string, Record<string, number[]>>;
  texts: Record<string, string>;
  fileExists: boolean;
  readyToRead: Promise<void>;
}

export interface FakeMentionNotes {
  notes: MentionNotes;
  stopped: string[];
}

export const NO_MENTIONS: FakeMentionSetup = { campaignFolders: ["Pale Moon"], links: {}, texts: {}, fileExists: true, readyToRead: Promise.resolve() };

function fileAt(path: string): TFile {
  return { path, basename: path.slice(path.lastIndexOf("/") + 1, -3) } as TFile;
}

function linesOf(setup: FakeMentionSetup, target: string): Record<string, number[]> {
  if (!Object.hasOwn(setup.links, target)) return {};
  return setup.links[target] as Record<string, number[]>;
}

export function fakeMentionNotes(setup: FakeMentionSetup): FakeMentionNotes {
  const stopped: string[] = [];
  const notes: MentionNotes = {
    fileAt: (path) => {
      if (!setup.fileExists) return null;
      return fileAt(path);
    },
    textOf: async (file) => {
      await setup.readyToRead;
      if (!Object.hasOwn(setup.texts, file.path)) return "";
      return setup.texts[file.path] as string;
    },
    campaignFolders: () => setup.campaignFolders,
    onNoteMoved: () => () => stopped.push("moved"),
    linkingPaths: (target) => Object.keys(linesOf(setup, target)),
    linkedLines: (path, target) => {
      const lines = linesOf(setup, target);
      if (!Object.hasOwn(lines, path)) return [];
      return lines[path] as number[];
    },
    onLinksResolved: () => () => stopped.push("resolved"),
  };
  return { notes, stopped };
}
