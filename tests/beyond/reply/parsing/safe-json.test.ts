import { describe, expect, it } from "vitest";
import { safeJsonOf } from "../../../../src/beyond/reply/parsing/safe-json";
import { Refusal } from "../../../../src/beyond/shape/refusal";

function text(length: number): string {
  return `"${"a".repeat(length - 2)}"`;
}

function nested(levels: number): string {
  return `${"[".repeat(levels)}${"]".repeat(levels)}`;
}

describe("safeJsonOf", () => {
  it("keeps every other key and value, in every position", () => {
    expect(safeJsonOf('{"name":"Primary","items":[{"name":"Rope"},"Torch",3],"gone":null}')).toEqual({
      name: "Primary",
      items: [{ name: "Rope" }, "Torch", 3],
      gone: null,
    });
  });

  it.each(["", "not json", "{", '{"a":}', "NaN", "{'a':1}", '{"a":1} extra', "undefined"])("refuses %j as not JSON, in plain words", (written) => {
    expect(() => safeJsonOf(written)).toThrow(new Refusal("The reply is not valid JSON."));
  });

  it("takes a reply of exactly the size cap", () => {
    expect(() => safeJsonOf(text(5_000_000))).not.toThrow();
  });

  it("refuses a reply one byte over the size cap", () => {
    expect(() => safeJsonOf(text(5_000_001))).toThrow("The reply is over the limit of 5000000 bytes.");
  });

  it("counts real bytes, not characters, against the size cap", () => {
    const twoByteCharacters = `"${"é".repeat(2_500_000)}"`;
    expect(twoByteCharacters.length).toBeLessThan(5_000_000);
    expect(() => safeJsonOf(twoByteCharacters)).toThrow("The reply is over the limit of 5000000 bytes.");
  });

  it("refuses an oversize reply by its size before looking at it any further", () => {
    expect(() => safeJsonOf(nested(2_500_001))).toThrow("The reply is over the limit of 5000000 bytes.");
  });

  it("takes nesting exactly at the cap", () => {
    expect(() => safeJsonOf(nested(32))).not.toThrow();
  });

  it("refuses nesting one level over the cap", () => {
    expect(() => safeJsonOf(nested(33))).toThrow("The reply's nesting is over the limit of 32 levels.");
  });

  it("refuses nesting far over the cap with the same words", () => {
    expect(() => safeJsonOf(nested(1_000_000))).toThrow(new Refusal("The reply's nesting is over the limit of 32 levels."));
  });

  it.each(["__proto__", "constructor", "prototype"])("drops the key %s at the top", (key) => {
    const read = safeJsonOf(`{"${key}":{"polluted":true},"kept":1}`);
    expect(Object.hasOwn(read as object, key)).toBe(false);
    expect(read).toEqual({ kept: 1 });
  });

  it.each(["__proto__", "constructor", "prototype"])("drops the key %s inside objects and arrays at any depth", (key) => {
    const read = safeJsonOf(`{"a":{"b":[{"${key}":{"polluted":true},"kept":1}]}}`);
    expect(read).toEqual({ a: { b: [{ kept: 1 }] } });
  });

  it("leaves the prototype of what it reads, and of every object, alone", () => {
    const read = safeJsonOf('{"__proto__":{"polluted":true}}') as object;
    expect(Object.getPrototypeOf(read)).toBe(Object.prototype);
    expect(Reflect.get({}, "polluted")).toBeUndefined();
  });

  it.each(["notes", "traits", "backstory", "avatarUrl"])("drops the personal key %s at the top and deeper", (key) => {
    const read = safeJsonOf(`{"${key}":"private","a":[{"${key}":{"x":"private"},"kept":1}]}`);
    expect(read).toEqual({ a: [{ kept: 1 }] });
  });

  it("keeps a key that only contains the name of a dropped one", () => {
    expect(safeJsonOf('{"notesOnly":1,"constructors":2,"my__proto__":3}')).toEqual({ notesOnly: 1, constructors: 2, my__proto__: 3 });
  });
});
