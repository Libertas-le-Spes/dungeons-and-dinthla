import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import { lineOpenerOf } from "../../../src/session-notes/lines/line-opener-of";
import { stubLineOpeners } from "./stub-line-openers";

const PATH = "Pale Moon/Sessions/Session 1.md";

const campaign = buildCampaign([
  {
    path: PATH,
    number: 1,
    firstLine: 0,
    text: [
      "? Who owns the Old Mill",
      "?= Who owns the Old Mill: Lady Vess",
      "! Find the caravan",
      "$ Silvered lantern",
      "$$ Silvered lantern :sold 30 gp",
      "$ 20 gp from Lady Vess",
      "Tracks lead north.",
    ].join("\n"),
  },
]);

function openerAt(line: number) {
  const openers = stubLineOpeners();
  return { openers, open: lineOpenerOf({ campaign, source: { path: PATH, line }, openers }) };
}

describe("lineOpenerOf", () => {
  it("opens a question's dialog for the line that asks it", () => {
    const { openers, open } = openerAt(0);
    const onClosed = vi.fn();
    open?.(onClosed);
    expect(openers.openQuestion).toHaveBeenCalledExactlyOnceWith({ path: PATH, line: 0 }, expect.any(Function));
    openers.openQuestion.mock.calls[0]?.[1](true);
    expect(onClosed).toHaveBeenCalledExactlyOnceWith({ changed: true, gone: false });
  });

  it("opens a quest's dialog for the line that gives it", () => {
    const { openers, open } = openerAt(2);
    open?.(vi.fn());
    expect(openers.openQuest).toHaveBeenCalledExactlyOnceWith({ path: PATH, line: 2 }, expect.any(Function));
  });

  it("opens an item's dialog, by the item's name, for each line that names or changes it", () => {
    for (const line of [3, 4]) {
      const { openers, open } = openerAt(line);
      open?.(vi.fn());
      expect(openers.openItem).toHaveBeenCalledExactlyOnceWith("Silvered lantern", { path: PATH, line }, expect.any(Function));
    }
  });

  it("opens a coin entry's dialog and says the note changed unless the dialog left it unchanged, and gone when it was deleted", () => {
    const { openers, open } = openerAt(5);
    const onClosed = vi.fn();
    open?.(onClosed);
    expect(openers.openLedgerEntry).toHaveBeenCalledExactlyOnceWith({ path: PATH, line: 5 }, expect.any(Function));
    const closed = openers.openLedgerEntry.mock.calls[0]?.[1];
    closed("unchanged");
    closed("written");
    closed("deleted");
    expect(onClosed.mock.calls).toEqual([
      [{ changed: false, gone: false }],
      [{ changed: true, gone: false }],
      [{ changed: true, gone: true }],
    ]);
  });

  it("has none for a follow-up, a plain line or a line of another note", () => {
    expect(openerAt(1).open).toBeNull();
    expect(openerAt(6).open).toBeNull();
    expect(lineOpenerOf({ campaign, source: { path: "Pale Moon/Sessions/Session 2.md", line: 0 }, openers: stubLineOpeners() })).toBeNull();
  });
});
