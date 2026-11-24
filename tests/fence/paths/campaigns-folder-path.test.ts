import { STUB_SPELLING } from "../../host/stub-spelling";
import { describe, expect, it } from "vitest";
import { BAD_NAME } from "../../../src/names/file-name";
import {
  isInConfigFolder,
  newCampaignsFolderPathOf,
  NO_FOLDER_NAME,
  NOT_A_HIDDEN_FOLDER,
  NOT_A_PLAIN_PATH,
  NOT_THE_WHOLE_VAULT,
  refusalForCampaignsFolder,
} from "../../../src/fence/paths/campaigns-folder-path";

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
    expect(newCampaignsFolderPathOf("  Games/D&D/ ", STUB_SPELLING)).toBe("Games/D&D");
  });

  it("asks for a name when none is typed", () => {
    expect(() => newCampaignsFolderPathOf("   ", STUB_SPELLING)).toThrow(NO_FOLDER_NAME);
  });

  it("refuses the whole vault", () => {
    expect(() => newCampaignsFolderPathOf("/", STUB_SPELLING)).toThrow(NOT_THE_WHOLE_VAULT);
  });

  it("refuses a path that steps out with ..", () => {
    expect(() => newCampaignsFolderPathOf("Games/../D&D", STUB_SPELLING)).toThrow(NOT_A_PLAIN_PATH);
  });

  it("refuses a hidden folder typed", () => {
    expect(() => newCampaignsFolderPathOf(".obsidian", STUB_SPELLING)).toThrow(NOT_A_HIDDEN_FOLDER);
  });

  it("refuses a part a folder can't be named", () => {
    expect(() => newCampaignsFolderPathOf("Games/D&D?", STUB_SPELLING)).toThrow(BAD_NAME);
  });
});

describe("isInConfigFolder", () => {
  it("finds the settings folder and the folders inside it", () => {
    expect(isInConfigFolder("Vault Settings", "Vault Settings")).toBe(true);
    expect(isInConfigFolder("Vault Settings/D&D", "Vault Settings")).toBe(true);
  });

  it("leaves out a folder whose name only starts with the settings folder's", () => {
    expect(isInConfigFolder("Vault Settings Old/D&D", "Vault Settings")).toBe(false);
  });

  it("finds the settings folder whatever its capitals, as a disk that ignores them does", () => {
    expect(isInConfigFolder("Config", "config")).toBe(true);
    expect(isInConfigFolder("CONFIG/D&D", "config")).toBe(true);
  });

  it("finds the settings folder written with other spaces, invisible characters or letters composed another way", () => {
    expect(isInConfigFolder("Vault\u00a0Settings", "Vault Settings")).toBe(true);
    expect(isInConfigFolder("Vault\u200b Settings/D&D", "Vault Settings")).toBe(true);
    expect(isInConfigFolder("Re\u0301glages", "R\u00e9glages")).toBe(true);
  });
});
