import { describe, expect, it } from "vitest";
import { charactersIn } from "../../../src/characters/reading/characters";
import type { Gate } from "../../../src/fence/gatekeeper";

const PALE_MOON = "Games/D&D/Pale Moon";
const SESSION = `${PALE_MOON}/Sessions/Session 1.md`;

function linktextOf(file: { path: string }, sourcePath: string, omitMdExtension: boolean): string {
  return `${file.path} from ${sourcePath}, without .md: ${String(omitMdExtension)}`;
}

function gateHolding(paths: string[]): Gate {
  const files = paths.map((path) => ({ path, basename: path.slice(path.lastIndexOf("/") + 1).replace(/\.md$/, "") }));
  return { files: { getMarkdownFiles: () => files }, metadata: { fileToLinktext: linktextOf } } as unknown as Gate;
}

function linkTo(path: string): string {
  return `${path} from ${SESSION}, without .md: true`;
}

describe("charactersIn", () => {
  it("takes the notes in the campaign's Characters folder, and folders inside it, by name", () => {
    const mira = `${PALE_MOON}/Characters/Mira.md`;
    const vess = `${PALE_MOON}/Characters/Villains/Lady Vess.md`;
    const gate = gateHolding([mira, vess]);
    expect(charactersIn(gate, PALE_MOON, SESSION)).toEqual([
      { name: "Lady Vess", linktext: linkTo(vess) },
      { name: "Mira", linktext: linkTo(mira) },
    ]);
  });

  it("leaves out notes elsewhere in the campaign, and a folder only named like Characters", () => {
    const mira = `${PALE_MOON}/Characters/Mira.md`;
    const gate = gateHolding([
      mira,
      `${PALE_MOON}/Places/Old Mill.md`,
      `${PALE_MOON}/Characters.md`,
      `${PALE_MOON}/Characters old/Jin.md`,
      `${PALE_MOON}/Pale Moon.md`,
    ]);
    expect(charactersIn(gate, PALE_MOON, SESSION)).toEqual([{ name: "Mira", linktext: linkTo(mira) }]);
  });

  it("leaves out another campaign's characters", () => {
    const mira = `${PALE_MOON}/Characters/Mira.md`;
    const gate = gateHolding([mira, "Games/D&D/Ashen Road/Characters/Jin.md"]);
    expect(charactersIn(gate, PALE_MOON, SESSION)).toEqual([{ name: "Mira", linktext: linkTo(mira) }]);
  });

  it("keeps the first note of a name when two folders hold it", () => {
    const first = `${PALE_MOON}/Characters/Mira.md`;
    const gate = gateHolding([first, `${PALE_MOON}/Characters/Villains/Mira.md`]);
    expect(charactersIn(gate, PALE_MOON, SESSION)).toEqual([{ name: "Mira", linktext: linkTo(first) }]);
  });
});
