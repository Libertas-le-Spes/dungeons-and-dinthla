import { describe, expect, it, vi } from "vitest";
import { flushWhenClosing } from "../../src/settings/flush-when-closing";

function closingWith(hidden: boolean) {
  return { onUnload: vi.fn(), onQuit: vi.fn(), onVisibilityChange: vi.fn(), onPageHide: vi.fn(), pageHidden: vi.fn(() => hidden) };
}

function handlerOf(registered: { mock: { calls: unknown[][] } }): () => void {
  const [[run]] = registered.mock.calls as [[() => void]];
  return run;
}

describe("flushWhenClosing", () => {
  it("writes waiting lines when the plugin unloads and when Obsidian quits", () => {
    const local = { flush: vi.fn() };
    const closing = closingWith(false);
    flushWhenClosing(local, closing);
    expect(local.flush).not.toHaveBeenCalled();
    handlerOf(closing.onUnload)();
    expect(local.flush).toHaveBeenCalledOnce();
    handlerOf(closing.onQuit)();
    expect(local.flush).toHaveBeenCalledTimes(2);
  });

  it("writes waiting lines when the page is hidden, as a phone does when the app is left", () => {
    const local = { flush: vi.fn() };
    const closing = closingWith(true);
    flushWhenClosing(local, closing);
    handlerOf(closing.onVisibilityChange)();
    expect(local.flush).toHaveBeenCalledOnce();
  });

  it("doesn't write when the page becomes visible again", () => {
    const local = { flush: vi.fn() };
    const closing = closingWith(false);
    flushWhenClosing(local, closing);
    handlerOf(closing.onVisibilityChange)();
    expect(closing.pageHidden).toHaveBeenCalledOnce();
    expect(local.flush).not.toHaveBeenCalled();
  });

  it("writes waiting lines when the page is put away", () => {
    const local = { flush: vi.fn() };
    const closing = closingWith(false);
    flushWhenClosing(local, closing);
    handlerOf(closing.onPageHide)();
    expect(local.flush).toHaveBeenCalledOnce();
  });
});
