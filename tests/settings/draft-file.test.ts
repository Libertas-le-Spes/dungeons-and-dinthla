import { describe, expect, it, vi } from "vitest";
import { DRAFT_PAUSE_MS, DraftFile } from "../../src/settings/draft-file";
import type { PluginSettings } from "../../src/settings/plugin-settings";

const THREE = "Pale Moon/Sessions/Session 3.md";

function fileWith(save: (settings: PluginSettings) => Promise<void> = async () => {}) {
  const settings: PluginSettings = { campaignFolder: "Pale Moon", drafts: {} };
  const waiting = new Map<number, () => void>();
  let next = 0;
  const timer = {
    start: vi.fn((run: () => void) => {
      next += 1;
      waiting.set(next, run);
      return next;
    }),
    stop: vi.fn((id: number) => waiting.delete(id)),
  };
  const runWaiting = () => {
    for (const [id, run] of [...waiting]) {
      waiting.delete(id);
      run();
    }
  };
  const saved: PluginSettings[] = [];
  const saveData = vi.fn(async (changed: PluginSettings) => {
    saved.push(structuredClone(changed));
    await save(changed);
  });
  const failed = vi.fn();
  const file = new DraftFile(settings, saveData, timer, failed);
  return { file, settings, timer, runWaiting, saveData, saved, failed };
}

describe("DraftFile", () => {
  it("writes the unsaved lines with the other settings after a short pause, not while typing", () => {
    const { file, timer, runWaiting, saveData, saved } = fileWith();
    file.changed({ [THREE]: "? W" });
    file.changed({ [THREE]: "? Who" });
    expect(saveData).not.toHaveBeenCalled();
    expect(timer.start).toHaveBeenLastCalledWith(expect.any(Function), DRAFT_PAUSE_MS);
    expect(timer.stop).toHaveBeenCalledExactlyOnceWith(1);
    runWaiting();
    expect(saved).toEqual([{ campaignFolder: "Pale Moon", drafts: { [THREE]: "? Who" } }]);
  });

  it("writes what is waiting at once when the plugin closes, and nothing when nothing waits", () => {
    const { file, saveData, timer } = fileWith();
    file.flush();
    expect(saveData).not.toHaveBeenCalled();
    file.changed({ [THREE]: "? Who" });
    file.flush();
    expect(timer.stop).toHaveBeenCalledExactlyOnceWith(1);
    expect(saveData).toHaveBeenCalledOnce();
    file.flush();
    expect(saveData).toHaveBeenCalledOnce();
  });

  it("says so when the write fails", async () => {
    const error = new Error("disk full");
    const { file, runWaiting, failed } = fileWith(async () => Promise.reject(error));
    file.changed({ [THREE]: "? Who" });
    runWaiting();
    await vi.waitFor(() => expect(failed).toHaveBeenCalledExactlyOnceWith(error));
  });
});
