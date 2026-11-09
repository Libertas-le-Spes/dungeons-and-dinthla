import { describe, expect, it, vi } from "vitest";
import { flushWhenClosing } from "../../src/settings/flush-when-closing";

describe("flushWhenClosing", () => {
  it("writes waiting lines when the plugin unloads and when Obsidian quits", () => {
    const local = { flush: vi.fn() };
    const closing = { onUnload: vi.fn(), onQuit: vi.fn() };
    flushWhenClosing(local, closing);
    expect(local.flush).not.toHaveBeenCalled();
    const [[unloaded]] = closing.onUnload.mock.calls as [[() => void]];
    unloaded();
    expect(local.flush).toHaveBeenCalledOnce();
    const [[quit]] = closing.onQuit.mock.calls as [[() => void]];
    quit();
    expect(local.flush).toHaveBeenCalledTimes(2);
  });
});
