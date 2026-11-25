import { describe, expect, it } from "vitest";
import type { App, TFile } from "obsidian";
import { activePathOf } from "../../../../src/obsidian/views/opening/open-view";

describe("activePathOf", () => {
  const appShowing = (file: TFile | null) => ({ workspace: { getActiveFile: () => file } }) as unknown as App;

  it("gives the path of the note in front", () => {
    expect(activePathOf(appShowing({ path: "Pale Moon/Sessions/Session 2.md" } as TFile))).toBe("Pale Moon/Sessions/Session 2.md");
  });

  it("gives nothing when no note is in front", () => {
    expect(activePathOf(appShowing(null))).toBeNull();
  });
});
