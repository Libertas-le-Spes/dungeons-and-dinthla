import { describe, expect, it } from "vitest";
import { sessionHeadingOf } from "../../src/sessions/session-heading";
import { propertiesAt } from "../host/properties-at";

const PATH = "Pale Moon/Sessions/Session 13.md";

describe("sessionHeadingOf", () => {
  it("names the session and its title", () => {
    expect(sessionHeadingOf(PATH, propertiesAt(PATH, { title: " The ferry at dusk " }))).toBe("Session 13 · The ferry at dusk");
  });

  it("names only the session without a title, a written one, or properties", () => {
    expect(sessionHeadingOf(PATH, propertiesAt(PATH, { played: "2026-03-14" }))).toBe("Session 13");
    expect(sessionHeadingOf(PATH, propertiesAt(PATH, { title: "  " }))).toBe("Session 13");
    expect(sessionHeadingOf(PATH, propertiesAt(PATH, { title: 13 }))).toBe("Session 13");
    expect(sessionHeadingOf(PATH, propertiesAt(PATH, {}))).toBe("Session 13");
    expect(sessionHeadingOf(PATH, propertiesAt(PATH, null))).toBe("Session 13");
  });

  it("names only the session when its note isn't there", () => {
    expect(sessionHeadingOf(PATH, propertiesAt("Pale Moon/Sessions/Session 12.md", { title: "Elsewhere" }))).toBe("Session 13");
  });
});
