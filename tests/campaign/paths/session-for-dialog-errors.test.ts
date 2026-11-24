import { describe, expect, it, vi } from "vitest";
import { sessionForDialog } from "../../../src/campaign/paths/session-for-dialog";
import { latestSessionWanted } from "../../../src/campaign/paths/session-to-write";
import { RecordedTelling } from "../../host/showing/recorded-telling";

const BROKEN = new Error("The campaign couldn't be read.");

function throwBroken(): never {
  throw BROKEN;
}

vi.mock("../../../src/campaign/paths/session-to-write", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../src/campaign/paths/session-to-write")>();
  return { ...original, sessionToWrite: throwBroken };
});

describe("sessionForDialog, when choosing fails for a reason that isn't a refusal", () => {
  it("lets the error through and says nothing", () => {
    const files = { files: () => [] };
    const telling = new RecordedTelling();
    let thrown: unknown = null;
    try {
      sessionForDialog(files, telling, "Pale Moon", latestSessionWanted("Start a session first."));
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBe(BROKEN);
    expect(telling.said).toEqual([]);
  });
});
