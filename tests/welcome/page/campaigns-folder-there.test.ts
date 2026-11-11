import { describe, expect, it, vi } from "vitest";
import type { TFolder } from "obsidian";
import { campaignsFolderThere } from "../../../src/welcome/page/campaigns-folder-there";

function filesHolding(paths: string[]) {
  return {
    getFolderByPath: vi.fn((path: string) => {
      if (!paths.includes(path)) return null;
      return { path } as TFolder;
    }),
  };
}

describe("campaignsFolderThere", () => {
  it("gives the saved folder when the vault holds it", () => {
    expect(campaignsFolderThere("D&D", filesHolding(["D&D"]))).toBe("D&D");
  });

  it("gives no folder when the saved folder was renamed or removed", () => {
    expect(campaignsFolderThere("D&D", filesHolding(["Games"]))).toBeNull();
  });

  it("looks the saved folder up by its exact path", () => {
    const files = filesHolding(["Games/D&D"]);
    campaignsFolderThere("Games/D&D", files);
    expect(files.getFolderByPath).toHaveBeenCalledExactlyOnceWith("Games/D&D");
  });

  it("gives no folder and looks nothing up while none is saved", () => {
    const files = filesHolding([]);
    expect(campaignsFolderThere(null, files)).toBeNull();
    expect(files.getFolderByPath).not.toHaveBeenCalled();
  });
});
