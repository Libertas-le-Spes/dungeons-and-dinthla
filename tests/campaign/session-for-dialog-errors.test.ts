import { beforeEach, describe, expect, it, vi } from "vitest";
import { sessionForDialog } from "../../src/campaign/session-for-dialog";
import { latestSessionWanted } from "../../src/campaign/session-to-write";
import { Notice } from "../stubs/obsidian";

const BROKEN = new Error("The campaign couldn't be read.");

function throwBroken(): never {
  throw BROKEN;
}

vi.mock("../../src/campaign/session-to-write", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/campaign/session-to-write")>();
  return { ...original, sessionToWrite: throwBroken };
});

beforeEach(() => {
  Notice.shown = [];
});

describe("sessionForDialog, when choosing fails for a reason that isn't a refusal", () => {
  it("lets the error through and says nothing", () => {
    const files = { getFiles: () => [] };
    let thrown: unknown = null;
    try {
      sessionForDialog(files, "Pale Moon", latestSessionWanted("Start a session first."));
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBe(BROKEN);
    expect(Notice.shown).toEqual([]);
  });
});
