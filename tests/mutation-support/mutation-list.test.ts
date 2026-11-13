import { describe, expect, it } from "vitest";
import { choiceOf } from "./mutation-list.ts";

const MUTATIONS = [{ id: "one", file: "a.ts", find: "x", replace: "y", group: "g" }];

describe("choiceOf", () => {
  it("keeps a misspelt flag apart, so it is refused and never starts a run", () => {
    expect(choiceOf(["--anchor"], MUTATIONS)).toMatchObject({ anchorsOnly: false, unknownFlags: ["--anchor"], unknown: [], wanted: [] });
  });

  it("knows the two flags it takes", () => {
    expect(choiceOf(["--anchors", "--allow-dirty"], MUTATIONS)).toMatchObject({ anchorsOnly: true, allowDirty: true, unknownFlags: [] });
  });

  it("sorts ids it has from ids it hasn't", () => {
    expect(choiceOf(["one", "two"], MUTATIONS)).toMatchObject({ wanted: ["one"], unknown: ["two"], unknownFlags: [] });
  });
});
