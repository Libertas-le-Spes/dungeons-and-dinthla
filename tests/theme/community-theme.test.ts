import { describe, expect, it } from "vitest";
import { usesCommunityTheme } from "../../src/theme/community-theme";

function vaultSettingsWithTheme(theme: unknown) {
  return { cssTheme: () => theme };
}

describe("usesCommunityTheme", () => {
  it("sees a community theme by its name", () => {
    expect(usesCommunityTheme(vaultSettingsWithTheme("Tokyo Night"))).toBe(true);
  });

  it("sees Obsidian's default theme when no theme is named", () => {
    expect(usesCommunityTheme(vaultSettingsWithTheme(""))).toBe(false);
    expect(usesCommunityTheme(vaultSettingsWithTheme(undefined))).toBe(false);
  });
});
