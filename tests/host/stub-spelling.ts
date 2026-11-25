import { normalizePath } from "../stubs/obsidian-text";
import type { PathSpelling } from "../../src/host/rules/path-spelling";

class StubSpelling implements PathSpelling {
  storedSpellingOf(path: string): string {
    return normalizePath(path);
  }
}

export const STUB_SPELLING: PathSpelling = new StubSpelling();
