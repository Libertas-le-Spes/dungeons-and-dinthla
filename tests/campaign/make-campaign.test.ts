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

  it("makes a campaign whose name holds a flag written with tag characters", async () => {
    const { vault, made } = vaultWith();
    const name = "Highlands \u{1f3f4}\u{e0067}\u{e0062}\u{e0073}\u{e0063}\u{e0074}\u{e007f}";
    await expect(makeCampaign(vault, name)).resolves.toBe(name);
    expect(made).toEqual([`folder ${name}`, `note ${name}/${name}.md ""`]);
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

  it("refuses a name that only differs from one at the top of the vault by invisible characters", async () => {
    for (const name of ["Ali\u200dce", "Ali\u034fce"]) {
      const { vault, made } = vaultWith({ topLevel: ["Alice"] });
      await expect(makeCampaign(vault, name)).rejects.toThrow();
      expect(made).toEqual([]);
    }
  });

  it("refuses a plain name when a folder made outside the plugin differs from it only by invisible characters", async () => {
    for (const existing of ["Ali\u200dce", "Ali\u034fce"]) {
      const { vault, made } = vaultWith({ topLevel: [existing] });
      await expect(makeCampaign(vault, "Alice")).rejects.toThrow(`called ${existing} at the top`);
      expect(made).toEqual([]);
    }
  });

  it("refuses a name that matches a folder at the top of the vault once both are composed the same way", async () => {
    const { vault, made } = vaultWith({ topLevel: ["Zoe\u0308"] });
    await expect(makeCampaign(vault, "Zo\u00eb")).rejects.toThrow("called Zoe\u0308 at the top");
    expect(made).toEqual([]);
  });

  it("refuses a name whose letter is composed differently from a folder's that hides an invisible character inside it", async () => {
    const existing = "Cafe\u200d\u0301";
    const { vault, made } = vaultWith({ topLevel: [existing] });
    await expect(makeCampaign(vault, "Caf\u00e9")).rejects.toThrow(`called ${existing} at the top`);
    expect(made).toEqual([]);
  });

  it("refuses a name that differs from a folder's at the top of the vault only by the kind of space", async () => {
    const { vault, made } = vaultWith({ topLevel: ["Mira\u3000Road"] });
    await expect(makeCampaign(vault, "Mira Road")).rejects.toThrow("called Mira\u3000Road at the top");
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
