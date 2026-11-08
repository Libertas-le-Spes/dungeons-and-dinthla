import { describe, expect, it } from "vitest";
import type { Vault } from "obsidian";
import { usesCommunityTheme } from "../../src/theme/community-theme";

function vaultWithTheme(theme: unknown): Vault {
  return { getConfig: () => theme } as unknown as Vault;
}

describe("usesCommunityTheme", () => {
  it("sees a community theme by its name", () => {
    expect(usesCommunityTheme(vaultWithTheme("Tokyo Night"))).toBe(true);
  });

  it("sees Obsidian's default theme when no theme is named", () => {
    expect(usesCommunityTheme(vaultWithTheme(""))).toBe(false);
    expect(usesCommunityTheme(vaultWithTheme(undefined))).toBe(false);
  });
});
