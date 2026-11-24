import { beforeEach, describe, expect, it, vi } from "vitest";
import { Refusal } from "../../../src/beyond/shape/refusal";
import { refuseUnlessOnlyThePropertyChanged } from "../../../src/imports/leaving/properties/property-read-back";
import { STUB_SYNTAX } from "../../host/stub-syntax";

const read = vi.hoisted(() => ({ results: [] as unknown[] }));

vi.mock("obsidian", async (original) => {
  const stubs = await original<Record<string, unknown>>();
  return { ...stubs, parseYaml: () => read.results.shift() };
});

const BEFORE = "---\nclass: Monk\nstanding: died\n---\n";
const AFTER = "---\nclass: Monk\nstanding: backup\n---\n";
const WORDS = "Changing standing would change the other properties.";

function refusalOf(work: () => unknown): string {
  try {
    work();
  } catch (error) {
    if (error instanceof Refusal) return error.message;
    throw error;
  }
  throw new Error("Nothing was refused.");
}

function check(): void {
  refuseUnlessOnlyThePropertyChanged(BEFORE, AFTER, "standing", "standing: backup", STUB_SYNTAX);
}

beforeEach(() => {
  read.results = [];
});

describe("the properties read before and after", () => {
  it("are refused when another property reads differently", () => {
    read.results = [{ class: "Monk", standing: "died" }, { class: "Rogue", standing: "backup" }, { standing: "backup" }];
    expect(refusalOf(check)).toBe(WORDS);
  });

  it("are refused when the property doesn't read as wanted", () => {
    read.results = [{ class: "Monk", standing: "died" }, { class: "Monk", standing: "retired" }, { standing: "backup" }];
    expect(refusalOf(check)).toBe(WORDS);
  });

  it("let through a change of only that property", () => {
    read.results = [{ class: "Monk", standing: "died" }, { class: "Monk", standing: "backup" }, { standing: "backup" }];
    expect(check()).toBeUndefined();
  });

  it("are refused when the wanted line doesn't read as properties", () => {
    read.results = [{ class: "Monk", standing: "died" }, { class: "Monk", standing: "backup" }, "just words"];
    expect(refusalOf(check)).toBe("The properties couldn't be read, so standing wasn't written. Fix them.");
  });

  it("are read as nothing when a block holds nothing", () => {
    read.results = [null, undefined, { standing: "backup" }];
    expect(refusalOf(check)).toBe(WORDS);
  });
});
