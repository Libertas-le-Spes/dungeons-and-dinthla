import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONFIRM_MS, SecondPress } from "../../src/views/second-press";

function pressed() {
  const shown: boolean[] = [];
  const confirmed = vi.fn();
  const press = new SecondPress((armed) => shown.push(armed), confirmed);
  return { press, shown, confirmed };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SecondPress", () => {
  it("only asks on the first press", () => {
    const { press, shown, confirmed } = pressed();
    press.press();
    expect(confirmed).not.toHaveBeenCalled();
    expect(shown).toEqual([true]);
  });

  it("goes ahead on a second press", () => {
    const { press, shown, confirmed } = pressed();
    press.press();
    press.press();
    expect(confirmed).toHaveBeenCalledOnce();
    expect(shown).toEqual([true, false]);
  });

  it("asks again when the second press comes too late", () => {
    const { press, shown, confirmed } = pressed();
    press.press();
    vi.advanceTimersByTime(CONFIRM_MS);
    press.press();
    expect(confirmed).not.toHaveBeenCalled();
    expect(shown).toEqual([true, false, true]);
  });

  it("changes nothing when stopped before a press", () => {
    const { press, shown } = pressed();
    press.stop();
    expect(shown).toEqual([]);
  });

  it("stops asking when stopped", () => {
    const { press, shown, confirmed } = pressed();
    press.press();
    press.stop();
    press.press();
    expect(confirmed).not.toHaveBeenCalled();
    expect(shown).toEqual([true, false, true]);
  });
});
