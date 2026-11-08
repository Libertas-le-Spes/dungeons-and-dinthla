import { afterEach, describe, expect, it, vi } from "vitest";
import { PENDING_FOCUS_MS, RowFocus } from "../../src/views/row-focus";

afterEach(() => {
  vi.useRealTimers();
});

describe("RowFocus", () => {
  it("puts focus back after a redraw that comes within three seconds of a change", () => {
    vi.useFakeTimers();
    const focusRow = vi.fn(() => true);
    const rowFocus = new RowFocus();
    rowFocus.afterClose(focusRow, true, vi.fn());
    vi.advanceTimersByTime(PENDING_FOCUS_MS);
    rowFocus.afterRender();
    expect(focusRow).toHaveBeenCalledTimes(2);
  });

  it("leaves focus alone on a redraw that comes later than three seconds after a change", () => {
    vi.useFakeTimers();
    const focusRow = vi.fn(() => false);
    const fallback = vi.fn();
    const rowFocus = new RowFocus();
    rowFocus.afterClose(focusRow, true, fallback);
    vi.advanceTimersByTime(PENDING_FOCUS_MS + 1);
    rowFocus.afterRender();
    expect(focusRow).toHaveBeenCalledOnce();
    expect(fallback).not.toHaveBeenCalled();
  });

  it("falls back when the row is gone after the redraw", () => {
    const fallback = vi.fn();
    const rowFocus = new RowFocus();
    rowFocus.afterClose(() => false, true, fallback);
    rowFocus.afterRender();
    expect(fallback).toHaveBeenCalledOnce();
  });
});
