import { describe, expect, it } from "vitest";
import { usesCommunityTheme } from "../../src/theme/community-theme";

function settingsWithTheme(theme: unknown) {
  return { cssTheme: () => theme };
}

describe("usesCommunityTheme", () => {
  it("sees a community theme by its name", () => {
    expect(usesCommunityTheme(settingsWithTheme("Tokyo Night"))).toBe(true);
  });

  it("sees Obsidian's default theme when no theme is named", () => {
    expect(usesCommunityTheme(settingsWithTheme(""))).toBe(false);
    expect(usesCommunityTheme(settingsWithTheme(undefined))).toBe(false);
  });
});
