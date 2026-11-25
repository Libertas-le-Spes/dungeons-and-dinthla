import { describe, expect, it, vi } from "vitest";
import { askInNoticeOf, FIX, KEEP } from "../../../src/views/dialogs/differing-notice";
import { RecordedTelling } from "../../host/showing/recorded-telling";

function asked() {
  const telling = new RecordedTelling();
  const fix = vi.fn();
  const keep = vi.fn();
  askInNoticeOf(telling)("Questions for Session 2 differ from the session.", fix, keep);
  return { telling, fix, keep };
}

describe("asking about a differing note", () => {
  it("asks once with the message, offering Fix then Keep", () => {
    const { telling } = asked();
    expect(telling.asked.map((ask) => [ask.words, ask.choices.map((choice) => choice.words)])).toEqual([["Questions for Session 2 differ from the session.", [FIX, KEEP]]]);
  });

  it.each([
    { pressed: 0, fixes: 1, keeps: 0 },
    { pressed: 1, fixes: 0, keeps: 1 },
  ])("runs only what choice $pressed stands for", ({ pressed, fixes, keeps }) => {
    const { telling, fix, keep } = asked();
    telling.asked[0]!.choices[pressed]!.chosen();
    expect(fix).toHaveBeenCalledTimes(fixes);
    expect(keep).toHaveBeenCalledTimes(keeps);
  });
});
