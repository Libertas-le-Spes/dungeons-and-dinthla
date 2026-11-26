import { describe, expect, it, vi } from "vitest";
import { fileURLToPath } from "node:url";
import { crc32, inflateRawSync } from "node:zlib";
import { gitIn, isAllowedInVault, pluginSettings, trackedDemoFiles } from "../../scripts/starter-vault/vault-files.ts";
import { ZipWriter } from "../../scripts/starter-vault/zip-writer.ts";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

interface ReadEntry {
  name: string;
  text: string;
  crcHolds: boolean;
}

function entriesOf(zip: Buffer): ReadEntry[] {
  const entries: ReadEntry[] = [];
  let at = 0;
  while (zip.readUInt32LE(at) === 0x04034b50) {
    const crc = zip.readUInt32LE(at + 14);
    const packedSize = zip.readUInt32LE(at + 18);
    const nameLength = zip.readUInt16LE(at + 26);
    const name = zip.toString("utf8", at + 30, at + 30 + nameLength);
    const start = at + 30 + nameLength;
    const bytes = inflateRawSync(zip.subarray(start, start + packedSize));
    entries.push({ name, text: bytes.toString("utf8"), crcHolds: crc32(bytes) === crc });
    at = start + packedSize;
  }
  return entries;
}

describe("the starter vault's zip", () => {
  it("holds each file under its name, packed so it reads back the same", () => {
    const zip = new ZipWriter();
    zip.add("vault/D&D/Pale Moon/Pale Moon.md", Buffer.from("A campaign.", "utf8"));
    zip.add("vault/Ünïcode name.md", Buffer.from("Words.", "utf8"));
    expect(entriesOf(zip.bytes())).toEqual([
      { name: "vault/D&D/Pale Moon/Pale Moon.md", text: "A campaign.", crcHolds: true },
      { name: "vault/Ünïcode name.md", text: "Words.", crcHolds: true },
    ]);
  });

  it("comes out the same each time it is built from the same files", () => {
    const built = () => {
      const zip = new ZipWriter();
      zip.add("vault/a.md", Buffer.from("A.", "utf8"));
      return zip.bytes();
    };
    expect(built().equals(built())).toBe(true);
  });
});

describe("the starter vault's files", () => {
  it.each([
    ".obsidian/community-plugins.json",
    ".obsidian/plugins/dungeons-and-dinthla/main.js",
    ".obsidian/plugins/dungeons-and-dinthla/manifest.json",
    ".obsidian/plugins/dungeons-and-dinthla/styles.css",
    ".obsidian/plugins/dungeons-and-dinthla/data.json",
    "D&D/Pale Moon/Pale Moon.md",
    "D&D/Pale Moon/Sessions/Session 1.md",
  ])("let %s in", (path) => {
    expect(isAllowedInVault(path)).toBe(true);
  });

  it.each([
    ".obsidian/workspace.json",
    ".obsidian/app.json",
    ".obsidian/plugins/other-plugin/main.js",
    "D&D/Pale Moon/Sessions/Old/Session 1.md",
    "D&D/Pale Moon/Art/map.png",
    "Notes/Shopping.md",
  ])("keep %s out", (path) => {
    expect(isAllowedInVault(path)).toBe(false);
  });

  it("reads the demo vault from git at the revision given, never from the working folder", () => {
    const git = vi.fn((args: string[]) => {
      if (args[0] === "ls-tree") return Buffer.from("demo-vault/D&D/Pale Moon/Pale Moon.md\0", "utf8");
      return Buffer.from("A campaign.", "utf8");
    });
    const files = trackedDemoFiles(git, "abc123");
    expect(git.mock.calls).toEqual([
      [["ls-tree", "-r", "-z", "--name-only", "abc123", "--", "demo-vault/"]],
      [["show", "abc123:demo-vault/D&D/Pale Moon/Pale Moon.md"]],
    ]);
    expect(files.map((file) => [file.path, file.bytes.toString("utf8")])).toEqual([["D&D/Pale Moon/Pale Moon.md", "A campaign."]]);
  });

  it("sets the Campaigns folder to D&D in the plugin's settings", () => {
    expect(JSON.parse(pluginSettings().bytes.toString("utf8"))).toEqual({ campaignsFolder: "D&D" });
  });

  it("lets in every file the committed demo vault holds", () => {
    const refused: string[] = [];
    for (const file of trackedDemoFiles(gitIn(ROOT), "HEAD")) {
      if (!isAllowedInVault(file.path)) refused.push(file.path);
    }
    expect(refused).toEqual([]);
  });
});
