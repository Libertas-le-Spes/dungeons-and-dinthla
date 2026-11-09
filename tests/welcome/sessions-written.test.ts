import { describe, expect, it } from "vitest";
import { sessionsWritten } from "../../src/welcome/sessions-written";

describe("sessionsWritten", () => {
  it("is true when any campaign holds a session note", () => {
    const paths = ["Silver Road/Silver Road.md", "Tin Hollow/Tin Hollow.md", "Tin Hollow/Sessions/Session 1.md"];
    expect(sessionsWritten(["Silver Road", "Tin Hollow"], paths)).toBe(true);
  });

  it("is false when the campaigns hold no session notes", () => {
    const paths = ["Silver Road/Silver Road.md", "Silver Road/Places/Mill.md"];
    expect(sessionsWritten(["Silver Road"], paths)).toBe(false);
  });

  it("is false when the only session notes are outside every campaign", () => {
    const paths = ["Silver Road/Silver Road.md", "Loose/Sessions/Session 1.md"];
    expect(sessionsWritten(["Silver Road"], paths)).toBe(false);
  });

  it("is false when the vault has no campaign", () => {
    expect(sessionsWritten([], ["Loose/Sessions/Session 1.md"])).toBe(false);
  });
});
