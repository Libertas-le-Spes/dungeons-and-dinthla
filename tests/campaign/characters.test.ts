import { describe, expect, it } from "vitest";
import { charactersIn } from "../../src/campaign/characters";
import type { Gate } from "../../src/fence/gatekeeper";

const PALE_MOON = "Games/D&D/Pale Moon";
const SESSION = `${PALE_MOON}/Sessions/Session 1.md`;

function gateHolding(paths: string[]): Gate {
  const files = paths.map((path) => ({ path, basename: path.slice(path.lastIndexOf("/") + 1).replace(/\.md$/, "") }));
  return {
    files: { getMarkdownFiles: () => files },
    metadata: { fileToLinktext: (file: { basename: string }) => file.basename },
  } as unknown as Gate;
}

describe("charactersIn", () => {
  it("takes the notes in the campaign's Characters folder, and folders inside it, by name", () => {
    const gate = gateHolding([`${PALE_MOON}/Characters/Mira.md`, `${PALE_MOON}/Characters/Villains/Lady Vess.md`]);
    expect(charactersIn(gate, PALE_MOON, SESSION)).toEqual([
      { name: "Lady Vess", linktext: "Lady Vess" },
      { name: "Mira", linktext: "Mira" },
    ]);
  });

  it("leaves out notes elsewhere in the campaign, and a folder only named like Characters", () => {
    const gate = gateHolding([
      `${PALE_MOON}/Characters/Mira.md`,
      `${PALE_MOON}/Places/Old Mill.md`,
      `${PALE_MOON}/Characters.md`,
      `${PALE_MOON}/Characters old/Jin.md`,
      `${PALE_MOON}/Pale Moon.md`,
    ]);
    expect(charactersIn(gate, PALE_MOON, SESSION)).toEqual([{ name: "Mira", linktext: "Mira" }]);
  });

  it("leaves out another campaign's characters", () => {
    const gate = gateHolding([`${PALE_MOON}/Characters/Mira.md`, "Games/D&D/Ashen Road/Characters/Jin.md"]);
    expect(charactersIn(gate, PALE_MOON, SESSION)).toEqual([{ name: "Mira", linktext: "Mira" }]);
  });

  it("keeps the first note of a name when two folders hold it", () => {
    const gate = gateHolding([`${PALE_MOON}/Characters/Mira.md`, `${PALE_MOON}/Characters/Villains/Mira.md`]);
    expect(charactersIn(gate, PALE_MOON, SESSION)).toEqual([{ name: "Mira", linktext: "Mira" }]);
  });
});
