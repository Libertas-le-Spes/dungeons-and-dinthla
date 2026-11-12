import { describe, expect, it } from "vitest";
import { DecidedTargets } from "../../../src/session-notes/renumbering/decided-targets";

describe("DecidedTargets", () => {
  it("gives the new target decided for a target", () => {
    const decided = new DecidedTargets();
    decided.record("Session 4", "Session 3");
    expect(decided.newTarget("Session 4")).toBe("Session 3");
  });

  it("gives nothing for a target decided to stay", () => {
    const decided = new DecidedTargets();
    decided.record("Mira", null);
    expect(decided.newTarget("Mira")).toBeNull();
  });

  it("gives nothing for a target nobody decided, such as a link added after the decisions", () => {
    const decided = new DecidedTargets();
    decided.record("Session 4", "Session 3");
    expect(decided.newTarget("Session 5")).toBeNull();
  });

  it("says it has a change only when some target got a new one", () => {
    const decided = new DecidedTargets();
    expect(decided.hasChange()).toBe(false);
    decided.record("Mira", null);
    expect(decided.hasChange()).toBe(false);
    decided.record("Session 4", "Session 3");
    expect(decided.hasChange()).toBe(true);
  });
});
