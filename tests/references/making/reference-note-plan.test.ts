import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import { BAD_NAME } from "../../../src/names/file-name";
import { noNoteMessage, planReferenceNotes, sharedNameMessage } from "../../../src/references/making/reference-note-plan";
import { firstOf } from "../../stubs/lists";

const CAMPAIGN = "Pale Moon";

function session(number: number, lines: string[]): SessionNote {
  return { path: `${CAMPAIGN}/Sessions/Session ${number}.md`, number, text: lines.join("\n"), firstLine: 0 };
}

interface Scenario {
  sessions: SessionNote[];
  unresolved: Record<string, string[]>;
  existing: string[];
}

function unresolvedLinksFrom(table: Record<string, string[]>) {
  return (path: string): string[] => {
    const found = table[path];
    if (found === undefined) return [];
    return found;
  };
}

function everywhere(sessions: SessionNote[], names: string[]): Record<string, string[]> {
  return Object.fromEntries(sessions.map((one) => [one.path, names]));
}

function planFor({ sessions, unresolved, existing }: Scenario) {
  return planReferenceNotes({
    campaign: buildCampaign(sessions),
    sessions,
    campaignFolder: CAMPAIGN,
    existingNames: existing,
    unresolvedLinksOf: unresolvedLinksFrom(unresolved),
  });
}

function planUnresolved(sessions: SessionNote[], names: string[]) {
  return planFor({ sessions, unresolved: everywhere(sessions, names), existing: [] });
}

const THREE_FROM = [
  session(1, ["! Find the caravan, from: [[Lady Vess]]", "$ [[Lady Vess]] Silvered lantern"]),
  session(2, ["! Cross the river, from: [[Lady Vess]]"]),
];

describe("planReferenceNotes", () => {
  it("makes a character's note once a line says it is a person on three lines", () => {
    const plan = planUnresolved(THREE_FROM, ["Lady Vess"]);
    expect(plan.notes.map(({ name, kind, path }) => ({ name, kind, path }))).toEqual([{ name: "Lady Vess", kind: "character", path: `${CAMPAIGN}/Characters/Lady Vess.md` }]);
    expect(plan.refusals).toEqual([]);
  });

  it("makes nothing at two lines", () => {
    const plan = planUnresolved([session(1, ["! Find the caravan, from: [[Lady Vess]]", "$ [[Lady Vess]] Silvered lantern"])], ["Lady Vess"]);
    expect(plan.notes).toEqual([]);
  });

  it("makes a place's note in Places on three place lines", () => {
    const plan = planUnresolved([session(1, ["? Who is at @[[Old Mill]]", "? What is in @[[Old Mill]]", "! Burn @[[Old Mill]]"])], ["Old Mill"]);
    expect(plan.notes.map(({ kind, path }) => ({ kind, path }))).toEqual([{ kind: "place", path: `${CAMPAIGN}/Places/Old Mill.md` }]);
  });

  it("makes a place's note when one line says person and another says place", () => {
    const plan = planUnresolved([session(1, ["! Find the caravan, from: [[Old Mill]]", "! Burn @[[Old Mill]]", "? Who is at [[Old Mill]]"])], ["Old Mill"]);
    expect(plan.notes.map(({ kind, path }) => ({ kind, path }))).toEqual([{ kind: "place", path: `${CAMPAIGN}/Places/Old Mill.md` }]);
  });

  it("makes nothing for a name no line says is a person or a place", () => {
    const plan = planUnresolved([session(1, ["? Who is [[Mira]]", "? Where is [[Mira]]", "? Why is [[Mira]] here"])], ["Mira"]);
    expect(plan.notes).toEqual([]);
    expect(plan.refusals).toEqual([]);
  });

  it("names the earliest session that names it as where it was first named, whatever order the sessions come in", () => {
    const later = session(3, ["! Cross the river, from: [[Lady Vess]]"]);
    const plan = planUnresolved([later, ...THREE_FROM], ["Lady Vess"]);
    expect(firstOf(plan.notes).firstSession.number).toBe(1);
  });

  it("makes nothing for a name Obsidian can resolve in the vault", () => {
    const plan = planFor({ sessions: THREE_FROM, unresolved: {}, existing: [] });
    expect(plan.notes).toEqual([]);
    expect(plan.refusals).toEqual([]);
  });

  it("makes nothing when a session that names it resolves it, though another does not", () => {
    const unresolved = { [firstOf(THREE_FROM).path]: ["Lady Vess"] };
    expect(planFor({ sessions: THREE_FROM, unresolved, existing: [] }).notes).toEqual([]);
  });

  it("makes the note when every session that names it leaves it unresolved, and a session that doesn't name it says nothing", () => {
    const quiet = session(3, ["Nothing happened."]);
    const unresolved = everywhere(THREE_FROM, ["Lady Vess"]);
    expect(planFor({ sessions: [...THREE_FROM, quiet], unresolved, existing: [] }).notes).toHaveLength(1);
  });

  it.each([["Lady Vess"], ["lady vess"], ["LADY VESS"], ["Lady Vess"]])("links, and does not make again, a note already in the campaign named %s", (existing) => {
    const plan = planFor({ sessions: THREE_FROM, unresolved: everywhere(THREE_FROM, ["Lady Vess"]), existing: [existing] });
    expect(plan.notes).toEqual([]);
    expect(plan.refusals).toEqual([]);
  });

  it("links a note whose name differs only by how a letter is written", () => {
    const decomposed = "Zoe\u0308";
    const line = `! Go on, from: [[${decomposed}]]`;
    const sessions = [session(1, [line, line, line])];
    const plan = planFor({ sessions, unresolved: everywhere(sessions, [decomposed]), existing: ["Zo\u00eb"] });
    expect(plan.notes).toEqual([]);
  });

  it("says once, and makes nothing, for a name a file can't have", () => {
    const sessions = [session(1, ["! Go on, from: [[Lady: Vess]]", "! Go on, from: [[Lady: Vess]]", "! Go on, from: [[Lady: Vess]]"])];
    const plan = planUnresolved(sessions, ["Lady: Vess"]);
    expect(plan.notes).toEqual([]);
    expect(plan.refusals).toEqual([noNoteMessage("Lady: Vess", BAD_NAME)]);
  });

  it("makes only the first of two names that would share a file name, and says why", () => {
    const lines = ["! Go on, from: [[Lady Vess]]", "! Go on, from: [[Lady Vess]]", "! Go on, from: [[Lady Vess]]", "! Go on, from: [[lady vess]]", "! Go on, from: [[lady vess]]", "! Go on, from: [[lady vess]]"];
    const plan = planUnresolved([session(1, lines)], ["Lady Vess", "lady vess"]);
    expect(plan.notes.map(({ name }) => name)).toEqual(["Lady Vess"]);
    expect(plan.refusals).toEqual([sharedNameMessage("lady vess", "Lady Vess")]);
  });
});
