import { afterEach, describe, expect, it, vi } from "vitest";
import { NOTHING_ALLOWED } from "./allowance-sets";

vi.mock("node:fs", fakeFs);

function fakeFs(): object {
  return { readFileSync: vi.fn() };
}

const fs = await import("node:fs");
const { NameUses } = await import("./name-uses");

const PROJECT = "/made/up/root/tsconfig.json";
const FIRST_FILE = "/made/up/root/lib/first.ts";
const SECOND_FILE = "/made/up/root/lib/second.ts";
const IMPORTED_NOTICE = "lib/first.ts:1 imports Notice from obsidian";
const REFUSED_IMPORT = { allowances: NOTHING_ALLOWED, breach: /^lib\/[^:]+:\d+ imports (?<name>\w+) from obsidian/ };

class StubScanner {
  readonly breaches = vi.fn<(configPath: string, paths: string[]) => string[]>();
}

function fileText(text: string): void {
  vi.mocked(fs.readFileSync).mockReturnValue(text);
}

afterEach(() => {
  vi.mocked(fs.readFileSync).mockReset();
});

describe("NameUses", () => {
  it("scans a file once, however many of its names are looked up", () => {
    const scanner = new StubScanner();
    scanner.breaches.mockReturnValue([IMPORTED_NOTICE, "lib/first.ts:2 imports Setting from obsidian"]);
    fileText("Notice Setting");
    const uses = new NameUses(scanner, PROJECT, REFUSED_IMPORT);
    expect([uses.fileUsing([FIRST_FILE], "Notice"), uses.fileUsing([FIRST_FILE], "Setting")]).toEqual([FIRST_FILE, FIRST_FILE]);
    expect(scanner.breaches.mock.calls).toEqual([[PROJECT, [FIRST_FILE], NOTHING_ALLOWED]]);
  });

  it("goes on to the next file when the first one's scan doesn't refuse the name", () => {
    const scanner = new StubScanner();
    scanner.breaches.mockReturnValueOnce(["lib/first.ts:1 imports Setting from obsidian"]).mockReturnValueOnce(["lib/second.ts:1 imports Notice from obsidian"]);
    fileText("Notice Setting");
    expect(new NameUses(scanner, PROJECT, REFUSED_IMPORT).fileUsing([FIRST_FILE, SECOND_FILE], "Notice")).toBe(SECOND_FILE);
  });

  it("doesn't scan a file whose text never names it as a whole word", () => {
    const scanner = new StubScanner();
    fileText("NoticeBoard");
    expect(new NameUses(scanner, PROJECT, REFUSED_IMPORT).fileUsing([FIRST_FILE], "Notice")).toBeNull();
    expect(scanner.breaches).not.toHaveBeenCalled();
  });

  it.each([
    { reading: "a breach of another kind", breach: "lib/first.ts:1 uses the global Notice", refusal: REFUSED_IMPORT },
    { reading: "a pattern with no groups", breach: IMPORTED_NOTICE, refusal: { allowances: NOTHING_ALLOWED, breach: /imports \w+ from obsidian/ } },
  ])("finds no file using the name when the scan's refusal can't be read, with $reading", ({ breach, refusal }) => {
    const scanner = new StubScanner();
    scanner.breaches.mockReturnValue([breach]);
    fileText("Notice");
    expect(new NameUses(scanner, PROJECT, refusal).fileUsing([FIRST_FILE], "Notice")).toBeNull();
  });
});
