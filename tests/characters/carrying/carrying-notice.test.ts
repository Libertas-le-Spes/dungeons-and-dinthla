import { describe, expect, it, vi } from "vitest";
import { CarryingNotice } from "../../../src/characters/carrying/carrying-notice";
import { CarryingNoticeDialog } from "../../../src/characters/carrying/carrying-notice-dialog";

function noticeWith(alreadyShown: boolean) {
  const keepShown = vi.fn(() => Promise.resolve());
  const open = vi.fn();
  const notice = new CarryingNotice({ shown: () => alreadyShown, keepShown }, { open });
  return { notice, keepShown, open };
}

describe("CarryingNotice", () => {
  it("shows the notice once, and keeps that it was shown before showing it, when a campaign is made beside another", async () => {
    const { notice, keepShown, open } = noticeWith(false);
    await notice.campaignMade(true);
    expect(keepShown).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledOnce();
    expect(open.mock.calls[0]![0]).toBeInstanceOf(CarryingNoticeDialog);
    expect(keepShown.mock.invocationCallOrder[0]).toBeLessThan(open.mock.invocationCallOrder[0]!);
  });

  it("stays quiet when the first campaign is made, since there is no earlier character to carry", async () => {
    const { notice, keepShown, open } = noticeWith(false);
    await notice.campaignMade(false);
    expect(keepShown).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });

  it("stays quiet once the notice has been shown, whatever campaigns were deleted or made since", async () => {
    const { notice, keepShown, open } = noticeWith(true);
    await notice.campaignMade(true);
    expect(keepShown).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });
});
