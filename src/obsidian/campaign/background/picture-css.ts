import type { Platform } from "obsidian";

export type ResourcePlatform = Pick<typeof Platform, "isDesktopApp" | "isIosApp" | "isAndroidApp">;

interface ResourcePrefixes {
  readonly on: keyof ResourcePlatform;
  readonly prefixes: readonly string[];
}

const RESOURCE_PREFIXES: readonly ResourcePrefixes[] = [
  { on: "isDesktopApp", prefixes: ["app://"] },
  { on: "isIosApp", prefixes: ["capacitor://localhost/_capacitor_file_/"] },
  { on: "isAndroidApp", prefixes: ["http://localhost/_capacitor_file_/", "https://localhost/_capacitor_file_/"] },
];

const UNSAFE_IN_CSS_URL = /["'()\\\s\u0000-\u001f\u007f]/gu;

function prefixesOn(platform: ResourcePlatform): string[] {
  const shown = RESOURCE_PREFIXES.filter((entry) => platform[entry.on]);
  return shown.flatMap((entry) => entry.prefixes);
}

function isResourceUrl(url: string, platform: ResourcePlatform): boolean {
  return prefixesOn(platform).some((prefix) => url.startsWith(prefix));
}

function hexOf(byte: number): string {
  return byte.toString(16).toUpperCase().padStart(2, "0");
}

function percentEncoded(character: string): string {
  const bytes = Array.from(new TextEncoder().encode(character));
  return bytes.map((byte) => `%${hexOf(byte)}`).join("");
}

export class PictureCss {
  static readonly NONE = new PictureCss("");

  private constructor(readonly value: string) {}

  static of(url: string, platform: ResourcePlatform): PictureCss | null {
    if (!isResourceUrl(url, platform)) return null;
    const safe = url.replace(UNSAFE_IN_CSS_URL, percentEncoded);
    return new PictureCss(`url("${safe}")`);
  }
}
