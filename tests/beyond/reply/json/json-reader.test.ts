import { describe, expect, it } from "vitest";
import { JsonReader } from "../../../../src/beyond/reply/json/json-reader";
import type { Cap } from "../../../../src/beyond/shape/cap";
import { firstOf } from "../../builders/first-of";

function hasKeys(reader: JsonReader, keys: string[]): boolean[] {
  return keys.map((key) => reader.hasKey(key));
}

function nullKeys(reader: JsonReader, keys: string[]): boolean[] {
  return keys.map((key) => reader.isNullAt(key));
}

function trueKeys(reader: JsonReader, keys: string[]): boolean[] {
  return keys.map((key) => reader.isTrueAt(key));
}

function emptyKeys(reader: JsonReader, keys: string[]): boolean[] {
  return keys.map((key) => reader.holdsNothingAt(key));
}

function numbersAt(reader: JsonReader, keys: string[]): (number | null)[] {
  return keys.map((key) => reader.numberAt(key));
}

function namesOfEntries(entries: readonly JsonReader[]): string[] {
  return entries.map((entry) => entry.textAt("name"));
}

const TWO: Cap = { what: "The list", most: 2, unit: "things" };

function inheriting(key: string, value: unknown): object {
  return Object.create({ [key]: value });
}

describe("JsonReader.hasKey", () => {
  it("is true for a key the object holds", () => {
    expect(JsonReader.of({ name: "Primary" }).hasKey("name")).toBe(true);
  });

  it("is true for a key holding null, false or zero", () => {
    const reader = JsonReader.of({ a: null, b: false, c: 0, d: "" });
    expect(hasKeys(reader, ["a", "b", "c", "d"])).toEqual([true, true, true, true]);
  });

  it("is false for a key the object lacks", () => {
    expect(JsonReader.of({ name: "Primary" }).hasKey("level")).toBe(false);
  });

  it.each(["constructor", "toString", "hasOwnProperty", "__proto__"])("is false for %s, which every object inherits", (key) => {
    expect(JsonReader.of({}).hasKey(key)).toBe(false);
  });

  it("is false for a key only the prototype holds", () => {
    expect(JsonReader.of(inheriting("name", "Primary")).hasKey("name")).toBe(false);
  });

  it.each([null, undefined, 5, "text", true, ["name"]])("is false on %j, which is not an object", (value) => {
    expect(JsonReader.of(value).hasKey("0")).toBe(false);
    expect(JsonReader.of(value).hasKey("length")).toBe(false);
  });
});

describe("JsonReader.isNullAt", () => {
  it("is true only for null", () => {
    const reader = JsonReader.of({ a: null, b: 0, c: "", d: false, e: [] });
    expect(nullKeys(reader, ["a", "b", "c", "d", "e", "missing"])).toEqual([true, false, false, false, false, false]);
  });
});

describe("JsonReader.holdsNothingAt", () => {
  it("is true for null and for a missing key, and for nothing else", () => {
    const reader = JsonReader.of({ a: null, b: 0, c: "", d: false, e: [], f: {} });
    expect(emptyKeys(reader, ["a", "missing", "b", "c", "d", "e", "f"])).toEqual([true, true, false, false, false, false, false]);
  });

  it("is true for a key only the prototype holds", () => {
    expect(JsonReader.of(inheriting("name", "Primary")).holdsNothingAt("name")).toBe(true);
  });
});

describe("JsonReader.isTrueAt", () => {
  it("is true only for the value true", () => {
    const reader = JsonReader.of({ a: true, b: "true", c: 1, d: false, e: null });
    expect(trueKeys(reader, ["a", "b", "c", "d", "e", "missing"])).toEqual([true, false, false, false, false, false]);
  });
});

describe("JsonReader.textAt", () => {
  it("returns text as it is", () => {
    expect(JsonReader.of({ name: "Primary Monk" }).textAt("name")).toBe("Primary Monk");
  });

  it("returns empty text", () => {
    expect(JsonReader.of({ name: "" }).textAt("name")).toBe("");
  });

  it.each([5, true, null, ["Primary"], { name: "Primary" }])("refuses %j as not text", (value) => {
    expect(() => JsonReader.of({ name: value }).textAt("name")).toThrow('The reply\'s "name" is missing or is not text.');
  });

  it("refuses a missing key", () => {
    expect(() => JsonReader.of({}).textAt("name")).toThrow('The reply\'s "name" is missing or is not text.');
  });

  it("refuses a key only the prototype holds", () => {
    expect(() => JsonReader.of(inheriting("name", "Primary")).textAt("name")).toThrow("missing or is not text");
  });

  it("refuses text on something that is not an object", () => {
    expect(() => JsonReader.of("Primary").textAt("length")).toThrow("missing or is not text");
  });
});

describe("JsonReader.numberAt", () => {
  it("returns a number", () => {
    expect(JsonReader.of({ level: 4 }).numberAt("level")).toBe(4);
  });

  it("returns a negative number and a fraction as they are, for the range checks to judge", () => {
    const reader = JsonReader.of({ a: -3, b: 1.5, c: 0 });
    expect(numbersAt(reader, ["a", "b", "c"])).toEqual([-3, 1.5, 0]);
  });

  it.each(["4", "", "NaN", true, null, [4], { level: 4 }])("gives nothing for %j, which is not a number", (value) => {
    expect(JsonReader.of({ level: value }).numberAt("level")).toBeNull();
  });

  it.each([Infinity, -Infinity, NaN])("gives nothing for %s", (value) => {
    expect(JsonReader.of({ level: value }).numberAt("level")).toBeNull();
  });

  it("gives nothing for a missing key", () => {
    expect(JsonReader.of({}).numberAt("level")).toBeNull();
  });

  it("gives nothing for a key only the prototype holds", () => {
    expect(JsonReader.of(inheriting("level", 4)).numberAt("level")).toBeNull();
  });

  it("gives nothing on something that is not an object", () => {
    expect(JsonReader.of([4]).numberAt("0")).toBeNull();
  });
});

describe("JsonReader.readerAt", () => {
  it("reads inside an object", () => {
    expect(JsonReader.of({ race: { fullName: "Human" } }).readerAt("race").textAt("fullName")).toBe("Human");
  });

  it.each([[], [{ fullName: "Human" }], "Human", 5, true, null])("refuses %j as not an object", (value) => {
    expect(() => JsonReader.of({ race: value }).readerAt("race")).toThrow('The reply\'s "race" is missing or is not an object.');
  });

  it("refuses a missing key", () => {
    expect(() => JsonReader.of({}).readerAt("race")).toThrow("missing or is not an object");
  });

  it("refuses a key only the prototype holds", () => {
    expect(() => JsonReader.of(inheriting("race", { fullName: "Human" })).readerAt("race")).toThrow("missing or is not an object");
  });
});

describe("JsonReader.listAt", () => {
  it("reads each entry of a list", () => {
    const entries = JsonReader.of({ items: [{ name: "Rope" }, { name: "Torch" }] }).listAt("items", TWO);
    expect(namesOfEntries(entries)).toEqual(["Rope", "Torch"]);
  });

  it("reads an empty list", () => {
    expect(JsonReader.of({ items: [] }).listAt("items", TWO)).toEqual([]);
  });

  it("hands out an entry that is not an object as a reader that finds nothing", () => {
    const entry = firstOf(JsonReader.of({ items: [5] }).listAt("items", TWO));
    expect(entry?.hasKey("name")).toBe(false);
  });

  it("takes a list exactly at the cap", () => {
    expect(JsonReader.of({ items: [1, 2] }).listAt("items", TWO)).toHaveLength(2);
  });

  it("refuses a list one over the cap, naming the cap", () => {
    expect(() => JsonReader.of({ items: [1, 2, 3] }).listAt("items", TWO)).toThrow("The list is over the limit of 2 things.");
  });

  it.each([{}, { 0: "a", length: 1 }, "ab", 5, true, null])("refuses %j as not a list", (value) => {
    expect(() => JsonReader.of({ items: value }).listAt("items", TWO)).toThrow('The reply\'s "items" is missing or is not a list.');
  });

  it("refuses a missing key", () => {
    expect(() => JsonReader.of({}).listAt("items", TWO)).toThrow("missing or is not a list");
  });

  it("refuses a key only the prototype holds", () => {
    expect(() => JsonReader.of(inheriting("items", [1])).listAt("items", TWO)).toThrow("missing or is not a list");
  });
});

describe("JsonReader.booleanAt", () => {
  it.each([true, false])("gives the %j the object holds", (value) => {
    expect(JsonReader.of({ flag: value }).booleanAt("flag")).toBe(value);
  });

  it.each([null, "true", 1, [], {}])("refuses %j, saying it is not true or false", (value) => {
    expect(() => JsonReader.of({ flag: value }).booleanAt("flag")).toThrow('The reply\'s "flag" is missing or is not true or false.');
  });

  it("refuses a missing key, and a key only the prototype holds", () => {
    expect(() => JsonReader.of({}).booleanAt("flag")).toThrow("not true or false");
    expect(() => JsonReader.of(inheriting("flag", true)).booleanAt("flag")).toThrow("not true or false");
  });
});

describe("JsonReader.listAtOrEmpty", () => {
  it("gives the entries of a list", () => {
    expect(namesOfEntries(JsonReader.of({ list: [{ name: "a" }, { name: "b" }] }).listAtOrEmpty("list", TWO))).toEqual(["a", "b"]);
  });

  it.each([null, undefined])("gives no entries for %j", (value) => {
    expect(JsonReader.of({ list: value }).listAtOrEmpty("list", TWO)).toEqual([]);
  });

  it("gives no entries for a missing key", () => {
    expect(JsonReader.of({}).listAtOrEmpty("list", TWO)).toEqual([]);
  });

  it.each(["text", 5, {}])("refuses %j as not a list", (value) => {
    expect(() => JsonReader.of({ list: value }).listAtOrEmpty("list", TWO)).toThrow("not a list");
  });

  it("refuses a list over the cap", () => {
    expect(() => JsonReader.of({ list: [{}, {}, {}] }).listAtOrEmpty("list", TWO)).toThrow("The list is over the limit of 2 things.");
  });
});
