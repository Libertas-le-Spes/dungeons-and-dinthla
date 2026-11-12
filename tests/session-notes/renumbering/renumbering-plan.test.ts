import { describe, expect, it } from "vitest";
import {
  nameTakenWords,
  planRenumbering,
  sharedNumberWords,
  type NoRenumbering,
  type RenumberingPlan,
} from "../../../src/session-notes/renumbering/renumbering-plan";

const FOLDER = "Pale Moon";

function session(number: number | string): string {
  return `${FOLDER}/Sessions/Session ${number}.md`;
}

function sessions(numbers: number[]): string[] {
  return numbers.map(session);
}

function planned(paths: string[], deleted: number): RenumberingPlan {
  const plan = planRenumbering(FOLDER, paths, session(deleted));
  if ("error" in plan) throw new Error(plan.error);
  return plan;
}

function refused(paths: string[], deleted: number): NoRenumbering {
  const plan = planRenumbering(FOLDER, paths, session(deleted));
  if (!("error" in plan)) throw new Error("It planned instead of refusing.");
  return plan;
}

function movesOf(plan: RenumberingPlan): [number, number][] {
  return plan.renames.map((rename) => [rename.fromNumber, rename.toNumber]);
}

describe("planRenumbering", () => {
  it("moves every session after a deleted one up by one", () => {
    expect(movesOf(planned(sessions([1, 2, 3, 4, 5, 6, 7]), 3))).toEqual([
      [4, 3],
      [5, 4],
      [6, 5],
      [7, 6],
    ]);
  });

  it("closes every gap, so deleting 2 of 1, 2, 5 and 7 makes them 1, 2 and 3", () => {
    expect(movesOf(planned(sessions([1, 2, 5, 7]), 2))).toEqual([
      [5, 2],
      [7, 3],
    ]);
  });

  it("closes a gap below the deleted session too", () => {
    expect(movesOf(planned(sessions([1, 3, 5]), 5))).toEqual([[3, 2]]);
  });

  it("moves nothing when the last session is deleted and no gaps are below it", () => {
    expect(planned(sessions([1, 2, 3]), 3).renames).toEqual([]);
  });

  it("names the campaign the sessions are in", () => {
    expect(planned(sessions([1, 2]), 2).campaignFolder).toBe(FOLDER);
  });

  it("names each move's old and new file, lowest first", () => {
    expect(planned(sessions([1, 2, 5, 7]), 2).renames).toEqual([
      { from: session(5), to: session(2), fromNumber: 5, toNumber: 2 },
      { from: session(7), to: session(3), fromNumber: 7, toNumber: 3 },
    ]);
  });

  it("leaves Session 0 where it is and counts the rest from 1", () => {
    expect(movesOf(planned(sessions([0, 1, 2, 3]), 1))).toEqual([
      [2, 1],
      [3, 2],
    ]);
  });

  it("says the latest session is the one with the highest number once renamed", () => {
    expect(planned(sessions([1, 2, 5, 7]), 2).latest).toBe(session(3));
    expect(planned(sessions([1, 2, 3]), 3).latest).toBe(session(2));
  });

  it("says there is no latest session when the only one is deleted", () => {
    expect(planned(sessions([4]), 4)).toEqual({ campaignFolder: FOLDER, renames: [], latest: null });
  });

  it("leaves out files that are not session notes of the campaign", () => {
    const paths = [...sessions([1, 2, 3]), `${FOLDER}/Pale Moon.md`, `${FOLDER}/Characters/Mira.md`, "Ashen Road/Sessions/Session 9.md"];
    expect(movesOf(planned(paths, 1))).toEqual([
      [2, 1],
      [3, 2],
    ]);
  });

  it("refuses, naming the number, when two sessions share one", () => {
    const paths = [session(1), session(2), session("02"), session(3)];
    expect(refused(paths, 1)).toEqual({ error: sharedNumberWords(2) });
  });

  it("refuses when the deleted session shares its number with another", () => {
    expect(refused([session(3), session("03")], 3)).toEqual({ error: sharedNumberWords(3) });
  });

  it("refuses, naming the file, when a new name is taken by a file that isn't a session note", () => {
    const paths = [...sessions([1, 3, 4]), `${FOLDER}/Sessions/session 2.md`];
    expect(refused(paths, 3)).toEqual({ error: nameTakenWords(session(2)) });
  });

  it("lets a new name be the deleted session's own name", () => {
    expect(movesOf(planned(sessions([1, 2, 3]), 1))).toEqual([
      [2, 1],
      [3, 2],
    ]);
  });

  it("refuses when a new name is taken by a file that is neither renamed nor deleted", () => {
    const paths = [...sessions([2, 4]), `${FOLDER}/Sessions/Session 1.MD`];
    expect(refused(paths, 4)).toEqual({ error: nameTakenWords(session(1)) });
  });
});
