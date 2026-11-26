import { describe, expect, it, vi } from "vitest";
import { sessionPropertiesOf } from "../../src/sessions/session-properties";
import { propertiesAt } from "../host/properties-at";

const PATH = "Pale Moon/Sessions/Session 12.md";

describe("sessionPropertiesOf", () => {
  it("reads the session's title and played date, trimmed, from its own note's properties", () => {
    const notes = propertiesAt(PATH, { title: " The Old Mill ", played: "2026-11-09" });
    const asked = vi.spyOn(notes.store, "note");
    expect(sessionPropertiesOf(PATH, notes)).toEqual({ title: "The Old Mill", played: "2026-11-09" });
    expect(asked).toHaveBeenCalledExactlyOnceWith(PATH);
  });

  it("leaves out what isn't written as text", () => {
    expect(sessionPropertiesOf(PATH, propertiesAt(PATH, { title: 12, played: ["2026-11-09"] }))).toEqual({ title: "", played: "" });
    expect(sessionPropertiesOf(PATH, propertiesAt(PATH, {}))).toEqual({ title: "", played: "" });
    expect(sessionPropertiesOf(PATH, propertiesAt(PATH, null))).toEqual({ title: "", played: "" });
  });

  it("reads nothing for a note that isn't there", () => {
    expect(sessionPropertiesOf(PATH, propertiesAt("Pale Moon/Sessions/Session 13.md", { title: "Elsewhere" }))).toEqual({ title: "", played: "" });
  });
});
