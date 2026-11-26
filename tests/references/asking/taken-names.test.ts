import { describe, expect, it } from "vitest";
import { takenNamesOf } from "../../../src/references/asking/taken-names";
import { fileAt } from "../../stubs/note-files";

const CAMPAIGN = "D&D/Pale Moon";
const OTHER = "D&D/Other Moon";

function takenFrom({ paths, frontmatter }: { paths: string[]; frontmatter: Record<string, Record<string, unknown> | null> }): string[] {
  const all = paths.map((path) => fileAt(path));
  const needs = {
    notes: {
      store: {
        notesUnder: (folder: string) => all.filter((file) => file.path.startsWith(`${folder}/`)),
        notes: () => all,
      },
      facts: {
        propertiesOf: (file: { path: string }) => {
          const found = frontmatter[file.path];
          if (found === undefined) return null;
          return found;
        },
      },
    },
    campaignFolders: () => [CAMPAIGN, OTHER],
  };
  return takenNamesOf({ needs, campaignFolder: CAMPAIGN });
}

describe("takenNamesOf", () => {
  it("holds the name of every note in the campaign, whatever its folder", () => {
    const paths = [`${CAMPAIGN}/Places/Old Mill.md`, `${CAMPAIGN}/Fallen/Mira.md`, `${CAMPAIGN}/Quests/Session 1.md`];
    expect(takenFrom({ paths, frontmatter: {} })).toEqual(["Old Mill", "Mira", "Session 1"]);
  });

  it("holds each alias of those notes, but not an alias that isn't text", () => {
    const path = `${CAMPAIGN}/Places/Old Mill.md`;
    expect(takenFrom({ paths: [path], frontmatter: { [path]: { aliases: ["The Mill", 3] } } })).toEqual(["Old Mill", "The Mill"]);
  });

  it("holds the alias of a note with no properties as nothing", () => {
    const path = `${CAMPAIGN}/Places/Old Mill.md`;
    expect(takenFrom({ paths: [path], frontmatter: { [path]: {} } })).toEqual(["Old Mill"]);
  });

  it("holds the characters of other campaigns, fallen ones too, but not their places", () => {
    const paths = [`${OTHER}/Characters/Thessaly.md`, `${OTHER}/Fallen/Garrick.md`, `${OTHER}/Places/Old Mill.md`, "Elsewhere/Characters/Stray.md"];
    expect(takenFrom({ paths, frontmatter: {} })).toEqual(["Thessaly", "Garrick"]);
  });

  it("holds the alias of a character of another campaign", () => {
    const path = `${OTHER}/Characters/Thessaly.md`;
    expect(takenFrom({ paths: [path], frontmatter: { [path]: { aliases: "Thess" } } })).toEqual(["Thessaly", "Thess"]);
  });

  it("holds a character of this campaign once", () => {
    expect(takenFrom({ paths: [`${CAMPAIGN}/Characters/Mira.md`], frontmatter: {} })).toEqual(["Mira"]);
  });
});
