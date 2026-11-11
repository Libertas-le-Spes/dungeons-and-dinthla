import { describe, expect, it } from "vitest";
import { mostRecentTab } from "../../../src/interface/tabs/most-recent-tab";

describe("mostRecentTab", () => {
  it("is the tab in view that was used last", () => {
    const tabs = [
      { tab: "Pale Moon left", shown: true, activeTime: 10 },
      { tab: "Pale Moon right", shown: true, activeTime: 30 },
      { tab: "Pale Moon behind", shown: false, activeTime: 50 },
    ];
    expect(mostRecentTab(tabs)).toBe("Pale Moon right");
  });

  it("is the tab used last when none is in view", () => {
    const tabs = [
      { tab: "Pale Moon first", shown: false, activeTime: 40 },
      { tab: "Pale Moon second", shown: false, activeTime: 20 },
    ];
    expect(mostRecentTab(tabs)).toBe("Pale Moon first");
  });

  it("is nothing when there are no tabs", () => {
    expect(mostRecentTab([])).toBeNull();
  });
});
