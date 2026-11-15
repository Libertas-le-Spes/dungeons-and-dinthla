import { describe, expect, it } from "vitest";
import type { UndecidedName } from "../../../src/references/making/reference-note-plan";
import { newNamesFor } from "../../../src/references/new-names/new-names";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

function undecided(name: string, namedIn: string[]): UndecidedName {
  return { name, namedIn, firstSession: { path: ONE, number: 1, text: "", firstLine: 0 } };
}

describe("newNamesFor", () => {
  it("lists only the names the saved session names, under that session's name", () => {
    const list = [undecided("Mira", [ONE, TWO]), undecided("Old Mill", [ONE])];
    const asked = newNamesFor({ undecided: list, savedPath: TWO, sessionName: "Session 2" });
    expect(asked?.sessionName).toBe("Session 2");
    expect(asked?.names.map(({ name }) => name)).toEqual(["Mira"]);
  });

  it("asks about nothing when the saved session names none of them", () => {
    expect(newNamesFor({ undecided: [undecided("Old Mill", [ONE])], savedPath: TWO, sessionName: "Session 2" })).toBeNull();
  });

  it("asks about nothing when no name is undecided", () => {
    expect(newNamesFor({ undecided: [], savedPath: TWO, sessionName: "Session 2" })).toBeNull();
  });
});
