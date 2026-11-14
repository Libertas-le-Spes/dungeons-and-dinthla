import { describe, expect, it } from "vitest";
import { Refusal } from "../../src/beyond/shape/refusal";
import { BEYOND_ADDRESS, beyondAddressOf } from "../../src/online/beyond-address";
import { CharacterId } from "../../src/online/character-id";
import { NOT_A_CHARACTER_LINK } from "../../src/online/online-words";

const ADDRESS_FOR_A_NUMBER = /^https:\/\/character-service\.dndbeyond\.com\/character\/v5\/character\/[1-9]\d{0,11}$/;

function addressFor(link: string): string {
  return beyondAddressOf(CharacterId.of(link));
}

describe("CharacterId.of", () => {
  it.each([
    { kind: "a bare number", link: "424242424", digits: "424242424" },
    { kind: "a bare number with spaces round it", link: "  424242424\n", digits: "424242424" },
    { kind: "a link with https and www", link: "https://www.dndbeyond.com/characters/424242424", digits: "424242424" },
    { kind: "a link with https only", link: "https://dndbeyond.com/characters/424242424", digits: "424242424" },
    { kind: "a link with http", link: "http://www.dndbeyond.com/characters/424242424", digits: "424242424" },
    { kind: "a link with neither", link: "dndbeyond.com/characters/424242424", digits: "424242424" },
    { kind: "a link with www and no https", link: "www.dndbeyond.com/characters/424242424", digits: "424242424" },
    { kind: "a link in capitals", link: "HTTPS://WWW.DNDBEYOND.COM/Characters/424242424", digits: "424242424" },
    { kind: "a link with a page after the number", link: "https://www.dndbeyond.com/characters/424242424/builder", digits: "424242424" },
    { kind: "a link with a question after the number", link: "https://www.dndbeyond.com/characters/424242424?tab=notes", digits: "424242424" },
    { kind: "a twelve digit number", link: "123456789012", digits: "123456789012" },
    { kind: "a one digit number", link: "7", digits: "7" },
  ])("takes the number from $kind, and nothing else", ({ link, digits }) => {
    expect(addressFor(link)).toBe(`${BEYOND_ADDRESS}${digits}`);
  });

  it.each([
    ["nothing", ""],
    ["spaces", "   "],
    ["words", "my character"],
    ["a zero", "0"],
    ["a number with a leading zero", "0424242424"],
    ["a number with a sign", "-424242424"],
    ["a number with a point", "1445.5"],
    ["thirteen digits", "1234567890123"],
    ["a link with thirteen digits", "https://www.dndbeyond.com/characters/1234567890123"],
    ["a number with a query", "424242424?x=1"],
    ["a number with a path", "424242424/../1"],
    ["a number with text after", "424242424 and more"],
    ["a link to another site", "https://example.com/characters/424242424"],
    ["a link to another site that names the right one", "https://example.com/dndbeyond.com/characters/424242424"],
    ["a link to a lookalike host", "https://dndbeyond.com.example.com/characters/424242424"],
    ["a link to a host with another letter for the dot", "https://www.dndbeyondXcom/characters/424242424"],
    ["a link with the number glued to a path", "https://www.dndbeyond.com/characters424242424"],
    ["a link to a subdomain", "https://evil.dndbeyond.com/characters/424242424"],
    ["a link with a login in it", "https://user@www.dndbeyond.com/characters/424242424"],
    ["a link to another page", "https://www.dndbeyond.com/monsters/424242424"],
    ["a link with no number", "https://www.dndbeyond.com/characters/"],
    ["a link with a letter first", "https://www.dndbeyond.com/characters/x424242424"],
    ["a number written in other digits", "１４４５４２０６３"],
  ])("refuses %s in plain words", (_kind, link) => {
    expect(() => CharacterId.of(link)).toThrow(new Refusal(NOT_A_CHARACTER_LINK));
  });

  it("keeps the number only through methods, so no other text is ever held", () => {
    const id = CharacterId.of("https://www.dndbeyond.com/characters/424242424/builder?x=1");
    expect(id.isNumber(424242424)).toBe(true);
    expect(id.isNumber(424242425)).toBe(false);
    expect(Object.keys(id)).toEqual([]);
    expect(JSON.stringify(id)).toBe("{}");
    expect(id.appendedTo("")).toBe("424242424");
  });
});

describe("a CharacterId made any other way", () => {
  it("fails when used, so a fake with the right shape can't be sent", () => {
    const appended = CharacterId.prototype.appendedTo;
    const matches = CharacterId.prototype.isNumber;
    expect(() => appended.call(Object.create(CharacterId.prototype), "x")).toThrow(TypeError);
    expect(() => appended.call(JSON.parse('{"digits":"1"}'), "x")).toThrow(TypeError);
    expect(() => matches.call(Object.create(CharacterId.prototype), 1)).toThrow(TypeError);
  });
});

describe("beyondAddressOf", () => {
  it("is the one address with the digits after it, for any link form", () => {
    for (const link of ["1", "424242424", "https://www.dndbeyond.com/characters/987654321012/sheet"]) expect(addressFor(link)).toMatch(ADDRESS_FOR_A_NUMBER);
  });

  it("keeps the address to the character service's character path", () => {
    expect(BEYOND_ADDRESS).toBe("https://character-service.dndbeyond.com/character/v5/character/");
  });
});
