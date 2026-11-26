import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import { Refusal } from "../../../src/beyond/shape/refusal";
import { NotesCast } from "../../../src/imports/leaving/cast/notes-cast";
import { MAIN_UNCLEAR } from "../../../src/imports/leaving/switching/switch-words";
import { madeUpCampaign } from "./leaving-table";
import { STUB_SYNTAX } from "../../host/stub-syntax";

const CAMPAIGN = "D&D/Primary Campaign";
const CAMPAIGN_NOTE_PATH = `${CAMPAIGN}/Primary Campaign.md`;

function noteAt(path: string): TFile {
  const name = path.substring(path.lastIndexOf("/") + 1);
  return { path, basename: name.replace(/\.md$/, "") } as TFile;
}

const CAMPAIGN_NOTE = noteAt(CAMPAIGN_NOTE_PATH);
const MONK = noteAt(`${CAMPAIGN}/Characters/Primary Monk.md`);

class MadeUpMetadata {
  readonly notes: TFile[] = [MONK];
  readonly asked: string[] = [];

  target(linkpath: string, sourcePath: string): TFile | null {
    this.asked.push(`${linkpath} from ${sourcePath}`);
    for (const note of this.notes) {
      if (note.basename === linkpath) return note;
    }
    return null;
  }

  linkTextTo(file: TFile, sourcePath: string): string {
    return `${file.basename} from ${sourcePath}`;
  }
}

class MadeUpFiles {
  constructor(private readonly paths: readonly string[]) {}

  getFiles(): TFile[] {
    return this.paths.map(noteAt);
  }

  getFileByPath(path: string): TFile | null {
    if (!this.paths.includes(path)) return null;
    return noteAt(path);
  }

  async cachedRead(file: TFile): Promise<string> {
    return `? A question in ${file.basename}`;
  }

  files(): TFile[] {
    return this.getFiles();
  }

  note(path: string): TFile | null {
    return this.getFileByPath(path);
  }

  async readKept(file: TFile): Promise<string> {
    return this.cachedRead(file);
  }
}

function propertiesWith(line: string): string {
  return `---\nrole: player\n${line}\n---\nOur table.\n`;
}

function castWith(paths: readonly string[] = []): { cast: NotesCast; metadata: MadeUpMetadata } {
  const metadata = new MadeUpMetadata();
  const files = new MadeUpFiles(paths);
  return { cast: new NotesCast(metadata, files, STUB_SYNTAX), metadata };
}

function refusalOf(asked: string): string {
  try {
    castWith().cast.mainFrom(CAMPAIGN_NOTE, asked);
  } catch (error) {
    if (error instanceof Refusal) return error.message;
    throw error;
  }
  throw new Error("Nothing was refused.");
}

describe("the campaign's main character, read from the text that was asked about", () => {
  it("is the note the character property links to, quoted or not, with an alias or a heading", () => {
    for (const written of ['character: "[[Primary Monk]]"', "character: [[Primary Monk]]", "character: '[[Primary Monk]]'", 'character: "[[Primary Monk|the Monk]]"', 'character: "[[Primary Monk#Notes]]"']) {
      expect(castWith().cast.mainFrom(CAMPAIGN_NOTE, propertiesWith(written))).toBe(MONK);
    }
  });

  it("resolves the link from the campaign note", () => {
    const { cast, metadata } = castWith();
    cast.mainFrom(CAMPAIGN_NOTE, propertiesWith('character: "[[Primary Monk]]"'));
    expect(metadata.asked).toEqual([`Primary Monk from ${CAMPAIGN_NOTE_PATH}`]);
  });

  it("is nobody when the property is missing or empty", () => {
    for (const asked of [propertiesWith("class: Monk"), propertiesWith("character:"), propertiesWith('character: ""'), propertiesWith("character: null"), "Our table.\n"]) {
      expect(castWith().cast.mainFrom(CAMPAIGN_NOTE, asked)).toBeNull();
    }
  });

  it("is refused when the property holds text, two links, more than a link, or a list", () => {
    for (const written of ["character: Primary Monk", 'character: "[[Primary Monk]] [[Primary Monk]]"', 'character: "[[Primary]][[ Monk]]"', 'character: "see [[Primary Monk]]"', "character:\n  - \"[[Primary Monk]]\"", 'character: "[[Primary Monk]]"\n  ']) {
      expect(refusalOf(propertiesWith(written))).toBe(MAIN_UNCLEAR);
    }
  });

  it("is nobody when the link is to a note that is gone, since the main's note was deleted", () => {
    expect(castWith().cast.mainFrom(CAMPAIGN_NOTE, propertiesWith('character: "[[Gone]]"'))).toBeNull();
  });

  it("is refused in words when the property is there twice", () => {
    expect(refusalOf(propertiesWith('character: "[[A]]"\ncharacter: "[[B]]"'))).toBe("The note has two character properties. Remove one.");
  });
});

describe("what the cast knows of the campaign", () => {
  it("links the latest session of the campaign, and nothing when there is none or two share the number", () => {
    const paths = [`${CAMPAIGN}/Sessions/Session 2.md`, `${CAMPAIGN}/Sessions/Session 10.md`, `${CAMPAIGN}/Sessions/Session 7.md`, "D&D/Secondary Campaign/Sessions/Session 40.md"];
    expect(castWith(paths).cast.latestSessionLink(CAMPAIGN, "here")).toBe("Session 10 from here");
    expect(castWith().cast.latestSessionLink(CAMPAIGN, "here")).toBeNull();
    expect(castWith([`${CAMPAIGN}/Sessions/Session 3.md`, `${CAMPAIGN}/Sessions/Session 3.md`]).cast.latestSessionLink(CAMPAIGN, "here")).toBeNull();
  });

  it("reads the campaign from its session notes", async () => {
    const campaign = await castWith([`${CAMPAIGN}/Sessions/Session 1.md`]).cast.campaignOf(CAMPAIGN);
    expect(campaign.questions.map((question) => question.text)).toEqual(["A question in Session 1"]);
    expect(madeUpCampaign().questions.length).toBeGreaterThan(1);
  });

  it("links a note as Obsidian would from another note", () => {
    expect(castWith().cast.linkTo(MONK, "there")).toBe("Primary Monk from there");
  });
});
