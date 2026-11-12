import { describe, expect, it } from "vitest";
import type { SessionRename } from "../../../src/session-notes/renumbering/renumbering-plan";
import { renameSourceGoneWords } from "../../../src/session-notes/renumbering/renumbering-words";
import { SessionRenamer } from "../../../src/session-notes/renumbering/session-renamer";
import { FakeCampaignFiles } from "./fake-campaign-files";

const FOLDER = "Pale Moon/Sessions";

function session(number: number): string {
  return `${FOLDER}/Session ${number}.md`;
}

function rename(from: number, to: number): SessionRename {
  return { from: session(from), to: session(to), fromNumber: from, toNumber: to };
}

function filesWith(numbers: number[]): FakeCampaignFiles {
  const notes: Record<string, string> = {};
  for (const number of numbers) notes[session(number)] = `Played ${number}`;
  return new FakeCampaignFiles(notes);
}

describe("SessionRenamer", () => {
  it("renames each session in the order given, through the gate", async () => {
    const files = filesWith([1, 4, 5]);
    const outcome = await new SessionRenamer(files).rename([rename(4, 2), rename(5, 3)]);
    expect(files.renames).toEqual([
      [session(4), session(2)],
      [session(5), session(3)],
    ]);
    expect(outcome).toEqual({ renamed: [rename(4, 2), rename(5, 3)], notRenamed: [], failure: null });
  });

  it("keeps each session's text under its new name", async () => {
    const files = filesWith([1, 4]);
    await new SessionRenamer(files).rename([rename(4, 2)]);
    expect(files.textAt(session(2))).toBe("Played 4");
    expect(files.textAt(session(4))).toBeUndefined();
  });

  it("renames nothing and succeeds when there is nothing to rename", async () => {
    const files = filesWith([1, 2]);
    expect(await new SessionRenamer(files).rename([])).toEqual({ renamed: [], notRenamed: [], failure: null });
    expect(files.rename).not.toHaveBeenCalled();
  });

  it("stops at a rename that fails, saying which were renamed and which weren't", async () => {
    const files = filesWith([1, 4, 5, 6]);
    files.failRenameOf(session(5), "the disk is full.");
    const outcome = await new SessionRenamer(files).rename([rename(4, 2), rename(5, 3), rename(6, 4)]);
    expect(files.renames).toEqual([[session(4), session(2)]]);
    expect(outcome).toEqual({ renamed: [rename(4, 2)], notRenamed: [rename(5, 3), rename(6, 4)], failure: "the disk is full." });
  });

  it("stops at a session whose note is gone, without renaming the ones after it", async () => {
    const files = filesWith([1, 5, 6]);
    const outcome = await new SessionRenamer(files).rename([rename(4, 2), rename(5, 3), rename(6, 4)]);
    expect(files.rename).not.toHaveBeenCalled();
    expect(outcome).toEqual({ renamed: [], notRenamed: [rename(4, 2), rename(5, 3), rename(6, 4)], failure: renameSourceGoneWords(session(4)) });
  });
});
