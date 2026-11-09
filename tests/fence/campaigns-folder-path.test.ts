import { describe, expect, it } from "vitest";
import { BAD_NAME } from "../../src/campaign/file-name";
import {
  newCampaignsFolderPathOf,
  NO_FOLDER_NAME,
  NOT_A_HIDDEN_FOLDER,
  NOT_A_PLAIN_PATH,
  NOT_THE_WHOLE_VAULT,
  refusalForCampaignsFolder,
} from "../../src/fence/campaigns-folder-path";

describe("refusalForCampaignsFolder", () => {
  it("takes a folder at any depth", () => {
    expect(refusalForCampaignsFolder("D&D")).toBeNull();
    expect(refusalForCampaignsFolder("Games/D&D")).toBeNull();
  });

  it("refuses the whole vault", () => {
    expect(refusalForCampaignsFolder("/")).toBe(NOT_THE_WHOLE_VAULT);
  });

  it("refuses a path that isn't plain", () => {
    for (const path of ["../D&D", "/D&D", "D&D/..", "", ".. ", "Games/.. ", "D&D."]) expect(refusalForCampaignsFolder(path)).toBe(NOT_A_PLAIN_PATH);
  });

  it("refuses the vault's settings folder, and any hidden folder or folder inside one", () => {
    for (const path of [".obsidian", ".obsidian/plugins", ".config", "Games/.hidden/D&D", "Games/.D&D"]) {
      expect(refusalForCampaignsFolder(path)).toBe(NOT_A_HIDDEN_FOLDER);
    }
  });
});

describe("newCampaignsFolderPathOf", () => {
  it("gives the typed path as Obsidian writes it", () => {
    expect(newCampaignsFolderPathOf("  Games/D&D/ ")).toBe("Games/D&D");
  });

  it("asks for a name when none is typed", () => {
    expect(() => newCampaignsFolderPathOf("   ")).toThrow(NO_FOLDER_NAME);
  });

  it("refuses the whole vault", () => {
    expect(() => newCampaignsFolderPathOf("/")).toThrow(NOT_THE_WHOLE_VAULT);
  });

  it("refuses a path that steps out with ..", () => {
    expect(() => newCampaignsFolderPathOf("Games/../D&D")).toThrow(NOT_A_PLAIN_PATH);
  });

  it("refuses a hidden folder typed", () => {
    expect(() => newCampaignsFolderPathOf(".obsidian")).toThrow(NOT_A_HIDDEN_FOLDER);
  });

  it("refuses a part a folder can't be named", () => {
    expect(() => newCampaignsFolderPathOf("Games/D&D?")).toThrow(BAD_NAME);
  });
});
