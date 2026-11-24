import { beforeEach, describe, expect, it, vi } from "vitest";
import { OBSIDIAN_TELLING } from "../../../../src/obsidian/views/frames/obsidian-telling";
import { NOTICE_STAYS_UNTIL_DISMISSED } from "../../../../src/views/dialogs/notice-stays";
import * as obsidian from "../../../stubs/obsidian";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("Obsidian's telling", () => {
  it("says words in a notice that fades", () => {
    const notice = vi.spyOn(obsidian, "Notice");
    OBSIDIAN_TELLING.say("Saved.");
    expect(notice.mock.calls).toEqual([["Saved."]]);
  });

  it("says words in a notice that stays until dismissed", () => {
    const notice = vi.spyOn(obsidian, "Notice");
    OBSIDIAN_TELLING.sayUntilDismissed("Look here.");
    expect(notice.mock.calls).toEqual([["Look here.", NOTICE_STAYS_UNTIL_DISMISSED]]);
  });
});
