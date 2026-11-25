import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const VAULT_FOLDER = "Dungeons & Dinthla starter vault";
const DEMO_FOLDER = "demo-vault/";
const PLUGIN_FOLDER = ".obsidian/plugins/dungeons-and-dinthla/";
const RELEASE_FILES = ["main.js", "manifest.json", "styles.css"];
const PLUGIN_SETTINGS = { campaignsFolder: "D&D" };

export interface VaultFile {
  readonly path: string;
  readonly bytes: Buffer;
}

function inPluginFolder(name: string): string {
  return `${PLUGIN_FOLDER}${name}`;
}

const ALLOWED_FILES = [".obsidian/community-plugins.json", inPluginFolder("data.json"), ...RELEASE_FILES.map(inPluginFolder)];
const CAMPAIGN_NOTE = /^D&D\/[^/]+(\/[^/]+)?\/[^/]+\.md$/;

export function isAllowedInVault(path: string): boolean {
  return ALLOWED_FILES.includes(path) || CAMPAIGN_NOTE.test(path);
}

export type GitRead = (args: string[]) => Buffer;

export function gitIn(root: string): GitRead {
  return function read(args: string[]): Buffer {
    return execFileSync("git", args, { cwd: root, maxBuffer: 64 * 1024 * 1024 });
  };
}

function withoutDemoFolder(path: string): string {
  return path.substring(DEMO_FOLDER.length);
}

export function trackedDemoFiles(git: GitRead, revision: string): VaultFile[] {
  const listed = git(["ls-tree", "-r", "-z", "--name-only", revision, "--", DEMO_FOLDER]).toString("utf8").split("\0");
  const files: VaultFile[] = [];
  for (const path of listed) {
    if (path === "") continue;
    files.push({ path: withoutDemoFolder(path), bytes: git(["show", `${revision}:${path}`]) });
  }
  return files;
}

export function releaseFiles(releaseFolder: string): VaultFile[] {
  const files: VaultFile[] = [];
  for (const name of RELEASE_FILES) files.push({ path: inPluginFolder(name), bytes: readFileSync(join(releaseFolder, name)) });
  return files;
}

export function pluginSettings(): VaultFile {
  return { path: inPluginFolder("data.json"), bytes: Buffer.from(`${JSON.stringify(PLUGIN_SETTINGS, null, 2)}\n`, "utf8") };
}
