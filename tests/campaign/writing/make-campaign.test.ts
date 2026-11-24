import { STUB_SPELLING } from "../../host/stub-spelling";
import { describe, expect, it } from "vitest";
import { BAD_NAME } from "../../../src/names/file-name";
import { makeCampaign, NO_CAMPAIGN_NAME, type NewCampaignFiles } from "../../../src/campaign/writing/make-campaign";
import { NO_CAMPAIGNS_FOLDER } from "../../../src/fence/paths/campaigns-folder-path";

interface FilesSetup {
  inCampaigns?: string[];
  atTheTop?: string[];
  noteFails?: boolean;
  removeFails?: boolean;
}

interface FolderNames {
  path: string;
  names: string[];
}

function filesWith({ inCampaigns = [], atTheTop = [], noteFails = false, removeFails = false }: FilesSetup = {}) {
  const made: string[] = [];
  const folders: FolderNames[] = [
    { path: "D&D", names: inCampaigns },
    { path: "/", names: atTheTop },
  ];
  const files: NewCampaignFiles = {
    namesIn: (path) => {
      const folder = folders.find((candidate) => candidate.path === path);
      if (folder === undefined) return [];
      return folder.names;
    },
    makeFolder: async (path) => {
      made.push(`folder ${path}`);
    },
    make: async (path, text) => {
      if (noteFails) throw new Error("The disk is full.");
      made.push(`note ${path} "${text}"`);
      return { path } as never;
    },
    removeEmptyFolder: async (path) => {
      if (removeFails) throw new Error("The folder is locked.");
      made.push(`removed ${path} if empty`);
    },
  };
  return { files, made };
}

describe("makeCampaign", () => {
  it("makes nothing while no Campaigns folder is set", async () => {
    const { files, made } = filesWith();
    await expect(makeCampaign(files, null, "Silver Road", STUB_SPELLING)).rejects.toThrow(NO_CAMPAIGNS_FOLDER);
    expect(made).toEqual([]);
  });

  it("makes a campaign in a Campaigns folder at any depth", async () => {
    const { files, made } = filesWith();
    await expect(makeCampaign(files, "Games/D&D", "Silver Road", STUB_SPELLING)).resolves.toBe("Games/D&D/Silver Road");
    expect(made).toEqual(["folder Games/D&D/Silver Road", 'note Games/D&D/Silver Road/Silver Road.md ""']);
  });

  it("doesn't compare against names elsewhere in the vault, only inside the Campaigns folder", async () => {
    const { files, made } = filesWith({ atTheTop: ["Silver Road"] });
    await expect(makeCampaign(files, "D&D", "Silver Road", STUB_SPELLING)).resolves.toBe("D&D/Silver Road");
    expect(made).toEqual(["folder D&D/Silver Road", 'note D&D/Silver Road/Silver Road.md ""']);
  });

  it("makes a folder inside the Campaigns folder and an empty main note of the same name, and gives back the folder", async () => {
    const { files, made } = filesWith();
    await expect(makeCampaign(files, "D&D", "Silver Road", STUB_SPELLING)).resolves.toBe("D&D/Silver Road");
    expect(made).toEqual(["folder D&D/Silver Road", 'note D&D/Silver Road/Silver Road.md ""']);
  });

  it("leaves out the spaces typed around the name", async () => {
    const { files, made } = filesWith();
    await expect(makeCampaign(files, "D&D", "  Silver Road ", STUB_SPELLING)).resolves.toBe("D&D/Silver Road");
    expect(made).toEqual(["folder D&D/Silver Road", 'note D&D/Silver Road/Silver Road.md ""']);
  });

  it("uses the name as Obsidian writes a path, a non-breaking space turned into a plain one", async () => {
    const { files, made } = filesWith();
    await expect(makeCampaign(files, "D&D", "Silver\u00a0Road", STUB_SPELLING)).resolves.toBe("D&D/Silver Road");
    expect(made).toEqual(["folder D&D/Silver Road", 'note D&D/Silver Road/Silver Road.md ""']);
  });

  it("makes a campaign whose name holds a flag written with tag characters", async () => {
    const { files, made } = filesWith();
    const name = "Highlands \u{1f3f4}\u{e0067}\u{e0062}\u{e0073}\u{e0063}\u{e0074}\u{e007f}";
    await expect(makeCampaign(files, "D&D", name, STUB_SPELLING)).resolves.toBe(`D&D/${name}`);
    expect(made).toEqual([`folder D&D/${name}`, `note D&D/${name}/${name}.md ""`]);
  });

  it("asks for a name when none is typed, and makes nothing", async () => {
    const { files, made } = filesWith();
    await expect(makeCampaign(files, "D&D", "   ", STUB_SPELLING)).rejects.toThrow(NO_CAMPAIGN_NAME);
    expect(made).toEqual([]);
  });

  it("refuses a name a file can't have, and makes nothing", async () => {
    const { files, made } = filesWith();
    await expect(makeCampaign(files, "D&D", "Silver/Road", STUB_SPELLING)).rejects.toThrow(BAD_NAME);
    expect(made).toEqual([]);
  });

  it("refuses a name already used in the Campaigns folder, and says how to make that folder a campaign", async () => {
    const { files, made } = filesWith({ inCampaigns: ["Silver Road"] });
    await expect(makeCampaign(files, "D&D", "Silver Road", STUB_SPELLING)).rejects.toThrow("add a note called Silver Road inside it");
    expect(made).toEqual([]);
  });

  it("refuses a name that only differs from one in the Campaigns folder by invisible characters", async () => {
    for (const name of ["Ali\u200dce", "Ali\u034fce"]) {
      const { files, made } = filesWith({ inCampaigns: ["Alice"] });
      await expect(makeCampaign(files, "D&D", name, STUB_SPELLING)).rejects.toThrow();
      expect(made).toEqual([]);
    }
  });

  it("refuses a plain name when a folder made outside the plugin differs from it only by invisible characters", async () => {
    for (const existing of ["Ali\u200dce", "Ali\u034fce"]) {
      const { files, made } = filesWith({ inCampaigns: [existing] });
      await expect(makeCampaign(files, "D&D", "Alice", STUB_SPELLING)).rejects.toThrow(`called ${existing} in D&D`);
      expect(made).toEqual([]);
    }
  });

  it("refuses a name that matches a folder in the Campaigns folder once both are composed the same way", async () => {
    const { files, made } = filesWith({ inCampaigns: ["Zoe\u0308"] });
    await expect(makeCampaign(files, "D&D", "Zo\u00eb", STUB_SPELLING)).rejects.toThrow("called Zoe\u0308 in D&D");
    expect(made).toEqual([]);
  });

  it("refuses a name whose letter is composed differently from a folder's that hides an invisible character inside it", async () => {
    const existing = "Cafe\u200d\u0301";
    const { files, made } = filesWith({ inCampaigns: [existing] });
    await expect(makeCampaign(files, "D&D", "Caf\u00e9", STUB_SPELLING)).rejects.toThrow(`called ${existing} in D&D`);
    expect(made).toEqual([]);
  });

  it("refuses a name that differs from a folder's in the Campaigns folder only by the kind of space", async () => {
    const { files, made } = filesWith({ inCampaigns: ["Mira\u3000Road"] });
    await expect(makeCampaign(files, "D&D", "Mira Road", STUB_SPELLING)).rejects.toThrow("called Mira\u3000Road in D&D");
    expect(made).toEqual([]);
  });

  it("refuses a name that differs from one in the Campaigns folder only in capitals, naming the one there", async () => {
    const { files, made } = filesWith({ inCampaigns: ["silver road"] });
    await expect(makeCampaign(files, "D&D", "Silver Road", STUB_SPELLING)).rejects.toThrow("called silver road in D&D");
    expect(made).toEqual([]);
  });

  it("refuses a name that matches one in the Campaigns folder once its non-breaking space is made plain", async () => {
    const { files, made } = filesWith({ inCampaigns: ["Silver Road"] });
    await expect(makeCampaign(files, "D&D", "Silver\u00a0Road", STUB_SPELLING)).rejects.toThrow("called Silver Road in D&D");
    expect(made).toEqual([]);
  });

  it("removes the folder it made when the main note can't be made, and says why", async () => {
    const { files, made } = filesWith({ noteFails: true });
    await expect(makeCampaign(files, "D&D", "Silver Road", STUB_SPELLING)).rejects.toThrow("The disk is full.");
    expect(made).toEqual(["folder D&D/Silver Road", "removed D&D/Silver Road if empty"]);
  });

  it("still says why the note failed when the new folder can't be removed, and names the folder left behind", async () => {
    const { files, made } = filesWith({ noteFails: true, removeFails: true });
    await expect(makeCampaign(files, "D&D", "Silver Road", STUB_SPELLING)).rejects.toThrow(
      "The disk is full. The folder D&D/Silver Road is left behind: it couldn't be removed.",
    );
    expect(made).toEqual(["folder D&D/Silver Road"]);
  });
});
