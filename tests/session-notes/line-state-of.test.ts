import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { lineStateOf } from "../../src/session-notes/line-state-of";

const PATH = "Pale Moon/Sessions/Session 1.md";

const campaign = buildCampaign([
  {
    path: PATH,
    number: 1,
    firstLine: 0,
    text: [
      "? Who owns the Old Mill",
      "?= Who owns the Old Mill: Lady Vess",
      "? Why does the wheel turn at night",
      "! Find the caravan",
      "!= Find the caravan: found at the ford",
      "! Guard the Gilded Stag",
      "!x Guard the Gilded Stag: it burned",
      "! Ride to Thessaly",
      "$ Silvered lantern",
      "$$ Silvered lantern :sold 30 gp",
      "$ Rope",
      "$ 20 gp from Lady Vess",
    ].join("\n"),
  },
]);

function stateAt(line: number) {
  return lineStateOf(campaign, { path: PATH, line });
}

describe("lineStateOf", () => {
  it("ticks an answered question and leaves an open one", () => {
    expect(stateAt(0)).toEqual({ sign: "✓", label: "Answered", struck: false });
    expect(stateAt(2)).toBeNull();
  });

  it("ticks a completed quest, strikes an abandoned one and leaves an active one", () => {
    expect(stateAt(3)).toEqual({ sign: "✓", label: "Completed", struck: false });
    expect(stateAt(5)).toEqual({ sign: "✕", label: "Abandoned", struck: true });
    expect(stateAt(7)).toBeNull();
  });

  it("strikes an item that is gone and leaves one still held", () => {
    expect(stateAt(8)).toEqual({ sign: "✕", label: "Gone", struck: true });
    expect(stateAt(10)).toBeNull();
  });

  it("gives follow-ups, coin and lines of other notes no state", () => {
    expect(stateAt(1)).toBeNull();
    expect(stateAt(11)).toBeNull();
    expect(lineStateOf(campaign, { path: "Pale Moon/Sessions/Session 2.md", line: 0 })).toBeNull();
  });
});
