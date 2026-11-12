import { describe, expect, it } from "vitest";
import { latestThatExists } from "../../../src/session-notes/renumbering/latest-that-exists";
import type { RenumberingPlan, SessionRename } from "../../../src/session-notes/renumbering/renumbering-plan";
import { renameSourceGoneWords } from "../../../src/session-notes/renumbering/renumbering-words";
import { NOTHING_WRONG } from "./stub-renumbering";

function session(number: number): string {
  return `Pale Moon/Sessions/Session ${number}.md`;
}

function rename(from: number, to: number): SessionRename {
  return { from: session(from), to: session(to), fromNumber: from, toNumber: to };
}

const PLAN: RenumberingPlan = { campaignFolder: "Pale Moon", renames: [rename(5, 2), rename(7, 3)], latest: session(3) };

describe("latestThatExists", () => {
  it("is the plan's latest session when every rename went through", () => {
    expect(latestThatExists(PLAN, { ...NOTHING_WRONG, renamed: PLAN.renames })).toBe(session(3));
  });

  it("is the latest session under its old name when its rename didn't happen", () => {
    const report = { ...NOTHING_WRONG, renamed: [rename(5, 2)], notRenamed: [rename(7, 3)], renameFailure: "the disk is full." };
    expect(latestThatExists(PLAN, report)).toBe(session(7));
  });

  it("is the plan's latest session when it wasn't renamed at all", () => {
    const plan = { campaignFolder: "Pale Moon", renames: [rename(5, 2)], latest: session(9) };
    const report = { ...NOTHING_WRONG, notRenamed: [rename(5, 2)], renameFailure: "the disk is full." };
    expect(latestThatExists(plan, report)).toBe(session(9));
  });

  it("is the session below it, under its current name, when the latest session's note was gone so its rename failed", () => {
    const report = { ...NOTHING_WRONG, renamed: [rename(5, 2)], notRenamed: [rename(7, 3)], renameFailure: renameSourceGoneWords(session(7)) };
    expect(latestThatExists(PLAN, report)).toBe(session(2));
  });

  it("is no session when every session in the plan is gone", () => {
    const plan = { campaignFolder: "Pale Moon", renames: [rename(5, 2)], latest: session(2) };
    const report = { ...NOTHING_WRONG, notRenamed: [rename(5, 2)], renameFailure: renameSourceGoneWords(session(5)) };
    expect(latestThatExists(plan, report)).toBeNull();
  });

  it("is no session when the plan has none", () => {
    expect(latestThatExists({ campaignFolder: "Pale Moon", renames: [], latest: null }, NOTHING_WRONG)).toBeNull();
  });
});
