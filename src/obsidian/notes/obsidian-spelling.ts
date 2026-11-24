import { normalizePath } from "obsidian";
import type { PathSpelling } from "../../host/rules/path-spelling";

class ObsidianSpelling implements PathSpelling {
  storedSpellingOf(path: string): string {
    return normalizePath(path);
  }
}

export const OBSIDIAN_SPELLING: PathSpelling = new ObsidianSpelling();
