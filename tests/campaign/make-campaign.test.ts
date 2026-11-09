import { describe, expect, it } from "vitest";
import type { TAbstractFile, TFolder } from "obsidian";
import { BAD_NAME } from "../../src/campaign/file-name";
import { makeCampaign, NO_CAMPAIGN_NAME, type NewCampaignVault } from "../../src/campaign/make-campaign";

interface VaultSetup {
  topLevel?: string[];
  noteFails?: boolean;
  newFolderHolds?: string[];
  deleteFails?: boolean;
}

function folderNamed(name: string, children: TAbstractFile[]): TFolder {
  return { name, path: name, children } as unknown as TFolder;
}

function vaultWith({ topLevel = [], noteFails = false, newFolderHolds = [], deleteFails = false }: VaultSetup = {}) {
  const made: string[] = [];
  const folders = new Map<string, TFolder>();
  const root = folderNamed("/", topLevel.map((name) => ({ name, path: name }) as TAbstractFile));
  const vault: NewCampaignVault = {
    getRoot: () => root,
    getFolderByPath: (path) => {
      const folder = folders.get(path);
      if (folder === undefined) return null;
      return folder;
    },
    createFolder: async (path) => {
      made.push(`folder ${path}`);
      const held = newFolderHolds.map((name) => ({ name, path: `${path}/${name}` }) as TAbstractFile);
      const folder = folderNamed(path, held);
      folders.set(path, folder);
      return folder;
    },
    create: async (path, text) => {
      if (noteFails) throw new Error("The disk is full.");
      made.push(`note ${path} "${text}"`);
      return { path } as never;
    },
    delete: async (file) => {
      if (deleteFails) throw new Error("The folder is locked.");
      made.push(`deleted ${file.path}`);
    },
  };
  return { vault, made };
}

describe("makeCampaign", () => {
  it("makes a top-level folder and an empty main note of the same name, and gives back the folder", async () => {
    const { vault, made } = vaultWith();
    await expect(makeCampaign(vault, "Silver Road")).resolves.toBe("Silver Road");
    expect(made).toEqual(["folder Silver Road", 'note Silver Road/Silver Road.md ""']);
  });

  it("leaves out the spaces typed around the name", async () => {
    const { vault, made } = vaultWith();
    await expect(makeCampaign(vault, "  Silver Road ")).resolves.toBe("Silver Road");
    expect(made).toEqual(["folder Silver Road", 'note Silver Road/Silver Road.md ""']);
  });

  it("uses the name as Obsidian writes a path, a non-breaking space turned into a plain one", async () => {
    const { vault, made } = vaultWith();
    await expect(makeCampaign(vault, "Silver\u00a0Road")).resolves.toBe("Silver Road");
    expect(made).toEqual(["folder Silver Road", 'note Silver Road/Silver Road.md ""']);
  });

  it("asks for a name when none is typed, and makes nothing", async () => {
    const { vault, made } = vaultWith();
    await expect(makeCampaign(vault, "   ")).rejects.toThrow(NO_CAMPAIGN_NAME);
    expect(made).toEqual([]);
  });

  it("refuses a name a file can't have, and makes nothing", async () => {
    const { vault, made } = vaultWith();
    await expect(makeCampaign(vault, "Silver/Road")).rejects.toThrow(BAD_NAME);
    expect(made).toEqual([]);
  });

  it("refuses a name already used at the top of the vault, and says how to make that folder a campaign", async () => {
    const { vault, made } = vaultWith({ topLevel: ["Silver Road"] });
    await expect(makeCampaign(vault, "Silver Road")).rejects.toThrow("add a note called Silver Road inside it");
    expect(made).toEqual([]);
  });

  it("refuses a name that differs from one at the top of the vault only in capitals, naming the one there", async () => {
    const { vault, made } = vaultWith({ topLevel: ["silver road"] });
    await expect(makeCampaign(vault, "Silver Road")).rejects.toThrow("called silver road at the top");
    expect(made).toEqual([]);
  });

  it("refuses a name that matches one at the top of the vault once its non-breaking space is made plain", async () => {
    const { vault, made } = vaultWith({ topLevel: ["Silver Road"] });
    await expect(makeCampaign(vault, "Silver\u00a0Road")).rejects.toThrow("called Silver Road at the top");
    expect(made).toEqual([]);
  });

  it("removes the folder it made when the main note can't be made, and says why", async () => {
    const { vault, made } = vaultWith({ noteFails: true });
    await expect(makeCampaign(vault, "Silver Road")).rejects.toThrow("The disk is full.");
    expect(made).toEqual(["folder Silver Road", "deleted Silver Road"]);
  });

  it("leaves the new folder alone when something already landed in it, and says why the note failed", async () => {
    const { vault, made } = vaultWith({ noteFails: true, newFolderHolds: ["Map.png"] });
    await expect(makeCampaign(vault, "Silver Road")).rejects.toThrow(/^The disk is full\.$/);
    expect(made).toEqual(["folder Silver Road"]);
  });

  it("still says why the note failed when the new folder can't be removed, and names the folder left behind", async () => {
    const { vault, made } = vaultWith({ noteFails: true, deleteFails: true });
    await expect(makeCampaign(vault, "Silver Road")).rejects.toThrow(
      "The disk is full. The folder Silver Road is left behind: it couldn't be removed.",
    );
    expect(made).toEqual(["folder Silver Road"]);
  });
});
