import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import type { SessionNote } from "../../src/campaign/campaign";
import type { SheetValue } from "../../src/characters/character-sheet";
import { readCharacterSheet, type ReadSheet } from "../../src/characters/read-character-sheet";
import type { CarriedFrom, SheetNotes } from "../../src/characters/sheet-notes";

function fileAt(path: string): TFile {
  return { path, basename: path.slice(path.lastIndexOf("/") + 1, -3) } as TFile;
}

const MIRA = fileAt("Pale Moon/Characters/Mira.md");
const OLD_MIRA = "Ashen Road/Characters/Mira.md";

function sessionOf(campaign: string, number: number, lines: string[]): SessionNote {
  return { path: `${campaign}/Sessions/Session ${number}.md`, number, firstLine: 0, text: lines.join("\n") };
}

interface Setup {
  storeFolder?: string | null;
  sessions?: Record<string, SessionNote[]>;
  texts?: Record<string, string>;
  carriedFrom?: CarriedFrom | null;
}

function notesWith({ sessions = {}, texts = {}, carriedFrom = null }: Setup) {
  const sessionsAskedFor: string[] = [];
  const notes: SheetNotes = {
    holds: () => true,
    textOf: async (file) => {
      const text = texts[file.path];
      if (text === undefined) return "";
      return text;
    },
    pathOfLink: (linktext, sourcePath) => `${sourcePath.slice(0, sourcePath.indexOf("/"))}/Characters/${linktext}.md`,
    isOwnCharacter: () => false,
    campaignFolders: () => ["Ashen Road", "Pale Moon"],
    filesIn: () => [],
    sessionsOf: async (folder) => {
      sessionsAskedFor.push(folder);
      const found = sessions[folder];
      if (found === undefined) return [];
      return found;
    },
    onNoteChanged: () => () => {},
    fileAt: (path) => {
      if (path === OLD_MIRA) return fileAt(path);
      return null;
    },
    carriedFromOf: () => carriedFrom,
    onNoteMoved: () => () => {},
  };
  return { notes, sessionsAskedFor };
}

function valueNamed(read: ReadSheet, name: string): SheetValue {
  return [...read.sheet.abilities, ...read.sheet.values].find((value) => value.name === name)!;
}

describe("readCharacterSheet", () => {
  it("reads the open campaign's sessions from the store, with the character's own overrides", async () => {
    const { notes, sessionsAskedFor } = notesWith({ texts: { [MIRA.path]: "HP: 40" } });
    const sessions = [sessionOf("Pale Moon", 1, ["[[Mira]] AC: 15, HP: 38"])];
    const read = await readCharacterSheet(MIRA, { campaignFolder: "Pale Moon", sessionNotes: sessions }, notes);
    expect(sessionsAskedFor).toEqual([]);
    expect(read.campaignFolder).toBe("Pale Moon");
    expect(read.sessions).toBe(sessions);
    expect(valueNamed(read, "AC").state).toBe("learned");
    expect(valueNamed(read, "HP").state).toBe("override");
  });

  it("reads another campaign's sessions from the vault", async () => {
    const { notes, sessionsAskedFor } = notesWith({ sessions: { "Pale Moon": [sessionOf("Pale Moon", 1, ["[[Mira]] AC: 15"])] } });
    const read = await readCharacterSheet(MIRA, { campaignFolder: "Ashen Road", sessionNotes: [] }, notes);
    expect(sessionsAskedFor).toEqual(["Pale Moon"]);
    expect(valueNamed(read, "AC").shown!.value).toBe("15");
  });

  it("reads no sessions for a note outside any campaign", async () => {
    const { notes, sessionsAskedFor } = notesWith({ texts: { "Loose/Mira.md": "AC: 9" } });
    const read = await readCharacterSheet(fileAt("Loose/Mira.md"), { campaignFolder: "Pale Moon", sessionNotes: [] }, notes);
    expect(sessionsAskedFor).toEqual([]);
    expect(read.campaignFolder).toBeNull();
    expect(read.sessions).toEqual([]);
    expect(valueNamed(read, "AC").state).toBe("override");
  });

  it("carries the listed groups from the note named by carried from, read in its own campaign", async () => {
    const { notes } = notesWith({
      sessions: { "Ashen Road": [sessionOf("Ashen Road", 4, ["[[Mira]] INT: 11, AC: 12"])] },
      texts: { [OLD_MIRA]: "class: Cleric" },
      carriedFrom: { path: OLD_MIRA, groups: ["abilities"] },
    });
    const read = await readCharacterSheet(MIRA, { campaignFolder: "Pale Moon", sessionNotes: [] }, notes);
    expect(read.carriedPath).toBe(OLD_MIRA);
    expect(read.carriedCampaignFolder).toBe("Ashen Road");
    expect(valueNamed(read, "INT")).toMatchObject({ state: "carried", carriedCampaign: "Ashen Road" });
    expect(valueNamed(read, "AC").state).toBe("unknown");
    expect(valueNamed(read, "class").state).toBe("unknown");
  });

  it("carries nothing when the carried from note is gone", async () => {
    const { notes } = notesWith({ carriedFrom: { path: "Ashen Road/Characters/Gone.md", groups: ["values"] } });
    const read = await readCharacterSheet(MIRA, { campaignFolder: "Pale Moon", sessionNotes: [] }, notes);
    expect(read.carriedPath).toBeNull();
  });
});
