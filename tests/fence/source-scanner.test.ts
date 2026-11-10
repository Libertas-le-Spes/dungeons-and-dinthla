import { describe, expect, it } from "vitest";
import type { Symbol as TypeSymbol, Type } from "typescript/unstable/sync";
import { anyMemberCould, isOwnedByOneOf } from "./scan/type-shapes";

const OWNERS = ["Editor"];

function symbolOwnedBy(owner: TypeSymbol | undefined) {
  return { getParent: () => owner };
}

const PLAIN_TYPE = { flags: 0 } as Type;

describe("isOwnedByOneOf", () => {
  it("counts a name whose symbol can't be found as owned, so the scan fails closed", () => {
    expect(isOwnedByOneOf(undefined, OWNERS)).toBe(true);
  });

  it("counts a symbol with no owner as owned, so the scan fails closed", () => {
    expect(isOwnedByOneOf(symbolOwnedBy(undefined), OWNERS)).toBe(true);
  });

  it("tells a listed owner from any other", () => {
    expect(isOwnedByOneOf(symbolOwnedBy({ name: "Editor" } as TypeSymbol), OWNERS)).toBe(true);
    expect(isOwnedByOneOf(symbolOwnedBy({ name: "Ledger" } as TypeSymbol), OWNERS)).toBe(false);
  });
});

describe("anyMemberCould", () => {
  it("counts a value whose type can't be found as able to reach, so the scan fails closed", () => {
    expect(anyMemberCould(undefined, () => false)).toBe(true);
  });

  it("asks of a known type's members", () => {
    expect(anyMemberCould(PLAIN_TYPE, () => false)).toBe(false);
    expect(anyMemberCould(PLAIN_TYPE, () => true)).toBe(true);
  });
});
