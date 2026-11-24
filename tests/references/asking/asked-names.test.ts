import { describe, expect, it } from "vitest";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import { sessionNoteOf } from "../../../src/campaign/paths/session-file";
import { askedNamesIn } from "../../../src/references/asking/asked-names";
import { firstOf } from "../../stubs/lists";
import { STUB_SYNTAX } from "../../host/stub-syntax";

function session(number: number, lines: string[]): SessionNote {
  return sessionNoteOf(`Pale Moon/Sessions/Session ${number}.md`, number, lines.join("\n"), STUB_SYNTAX);
}

function askedFrom(sessions: SessionNote[]) {
  return askedNamesIn({ sessions, taken: [] });
}

function namesOf(sessions: SessionNote[]): string[] {
  return askedFrom(sessions).names.map(({ name }) => name);
}

const MILL = "We rode to [[Old Mill]].";

describe("askedNamesIn", () => {
  it("asks about a link on three lines, whatever kind of line each is", () => {
    expect(namesOf([session(1, ["$ Rope from [[Old Mill]]", "? Who built [[Old Mill]]", "Plain words about [[Old Mill]]"])])).toEqual(["Old Mill"]);
  });

  it("does not ask about a link on two lines", () => {
    expect(namesOf([session(1, [MILL, MILL])])).toEqual([]);
  });

  it("counts a link once for a line, however often it is on it", () => {
    expect(namesOf([session(1, ["[[Old Mill]] and [[Old Mill]]", "[[Old Mill]] [[Old Mill]]"])])).toEqual([]);
  });

  it("adds up the lines of every session", () => {
    expect(namesOf([session(1, [MILL, MILL]), session(2, [MILL])])).toEqual(["Old Mill"]);
  });

  it("counts a name once, whatever its folder, capitals, heading or shown text", () => {
    const lines = ["[[Places/Old Mill]]", "[[old mill]]", "[[Old Mill#Cellar|the mill]]"];
    expect(askedFrom([session(1, lines)]).names).toHaveLength(1);
  });

  it("names it as the first line wrote it, without its folder", () => {
    expect(namesOf([session(1, ["[[Places/Old Mill]]", "[[old mill]]", "[[old mill]]"])])).toEqual(["Old Mill"]);
  });

  it("ignores a name that is taken, in any case", () => {
    expect(askedNamesIn({ sessions: [session(1, [MILL, MILL, MILL])], taken: ["old MILL"] }).names).toEqual([]);
  });

  it("ignores links in code blocks, in code and in comments", () => {
    const lines = [MILL, "`[[Old Mill]]`", "%% [[Old Mill]] %%", "```", "[[Old Mill]]", "```"];
    expect(namesOf([session(1, lines)])).toEqual([]);
  });

  it("ignores a link with no name", () => {
    const asked = askedFrom([session(1, ["[[Places/]]", "[[Places/]]", "[[Places/]]"])]);
    expect(asked).toEqual({ names: [], refusals: [] });
  });

  it("names the earliest session that names it and every session that does, whatever order they come in", () => {
    const later = session(3, [MILL]);
    const earlier = session(1, [MILL, MILL]);
    const asked = firstOf(askedFrom([later, earlier]).names);
    expect(asked.firstSession).toBe(earlier);
    expect(asked.namedIn).toEqual([earlier.path, later.path]);
  });

  it("says why a name that can't be a note isn't asked about", () => {
    const asked = askedFrom([session(1, ["[[Lady: Vess]]", "[[Lady: Vess]]", "[[Lady: Vess]]"])]);
    expect(asked.names).toEqual([]);
    expect(asked.refusals).toHaveLength(1);
    expect(firstOf(asked.refusals)).toContain("No note was made for Lady: Vess");
  });
});
