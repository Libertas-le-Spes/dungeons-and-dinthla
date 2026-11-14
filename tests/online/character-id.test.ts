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
    ["a bare number", "144542063", "144542063"],
    ["a bare number with spaces round it", "  144542063\n", "144542063"],
    ["a link with https and www", "https://www.dndbeyond.com/characters/144542063", "144542063"],
    ["a link with https only", "https://dndbeyond.com/characters/144542063", "144542063"],
    ["a link with http", "http://www.dndbeyond.com/characters/144542063", "144542063"],
    ["a link with neither", "dndbeyond.com/characters/144542063", "144542063"],
    ["a link with www and no https", "www.dndbeyond.com/characters/144542063", "144542063"],
    ["a link in capitals", "HTTPS://WWW.DNDBEYOND.COM/Characters/144542063", "144542063"],
    ["a link with a page after the number", "https://www.dndbeyond.com/characters/144542063/builder", "144542063"],
    ["a link with a question after the number", "https://www.dndbeyond.com/characters/144542063?tab=notes", "144542063"],
    ["a twelve digit number", "123456789012", "123456789012"],
    ["a one digit number", "7", "7"],
  ])("takes the number from %s, and nothing else", (_kind, link, digits) => {
    expect(addressFor(link)).toBe(`${BEYOND_ADDRESS}${digits}`);
  });

  it.each([
    ["nothing", ""],
    ["spaces", "   "],
    ["words", "my character"],
    ["a zero", "0"],
    ["a number with a leading zero", "0144542063"],
    ["a number with a sign", "-144542063"],
    ["a number with a point", "1445.5"],
    ["thirteen digits", "1234567890123"],
    ["a link with thirteen digits", "https://www.dndbeyond.com/characters/1234567890123"],
    ["a number with a query", "144542063?x=1"],
    ["a number with a path", "144542063/../1"],
    ["a number with text after", "144542063 and more"],
    ["a link to another site", "https://example.com/characters/144542063"],
    ["a link to another site that names the right one", "https://example.com/dndbeyond.com/characters/144542063"],
    ["a link to a lookalike host", "https://dndbeyond.com.example.com/characters/144542063"],
    ["a link to a subdomain", "https://evil.dndbeyond.com/characters/144542063"],
    ["a link with a login in it", "https://user@www.dndbeyond.com/characters/144542063"],
    ["a link to another page", "https://www.dndbeyond.com/monsters/144542063"],
    ["a link with no number", "https://www.dndbeyond.com/characters/"],
    ["a link with a letter first", "https://www.dndbeyond.com/characters/x144542063"],
    ["a number written in other digits", "１４４５４２０６３"],
  ])("refuses %s in plain words", (_kind, link) => {
    expect(() => CharacterId.of(link)).toThrow(new Refusal(NOT_A_CHARACTER_LINK));
  });

  it("keeps the number only through methods, so no other text is ever held", () => {
    const id = CharacterId.of("https://www.dndbeyond.com/characters/144542063/builder?x=1");
    expect(id.isNumber(144542063)).toBe(true);
    expect(id.isNumber(144542064)).toBe(false);
    expect(Object.keys(id)).toEqual(["digits"]);
    expect(id.appendedTo("")).toBe("144542063");
  });
});

describe("beyondAddressOf", () => {
  it("is the one address with the digits after it, for any link form", () => {
    for (const link of ["1", "144542063", "https://www.dndbeyond.com/characters/987654321012/sheet"]) expect(addressFor(link)).toMatch(ADDRESS_FOR_A_NUMBER);
  });

  it("keeps the address to the character service's character path", () => {
    expect(BEYOND_ADDRESS).toBe("https://character-service.dndbeyond.com/character/v5/character/");
  });
});
