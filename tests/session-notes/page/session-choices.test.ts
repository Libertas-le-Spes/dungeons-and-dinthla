import { describe, expect, it } from "vitest";
import { sessionChoiceOf, sessionChoicesOf, sessionShown } from "../../../src/session-notes/page/session-choices";
import type { SessionProperties } from "../../../src/sessions/session-properties";

const PROPERTIES: Record<string, SessionProperties> = {
  "Pale Moon/Sessions/Session 12.md": { title: "The Old Mill", played: "2026-11-09" },
  "Pale Moon/Sessions/Session 2.md": { title: "", played: "2026-03-14" },
  "Pale Moon/Sessions/Session 7.md": { title: "Gilded Stag", played: "" },
};

function propertiesOf(path: string): SessionProperties {
  const properties = PROPERTIES[path];
  if (properties === undefined) return { title: "", played: "" };
  return properties;
}

function session(number: number) {
  return { path: `Pale Moon/Sessions/Session ${number}.md`, number };
}

describe("sessionChoicesOf", () => {
  it("lists sessions newest first, with title and date when they are given", () => {
    const choices = sessionChoicesOf([session(2), session(12), session(7), session(1)], propertiesOf);
    expect(choices.map((choice) => choice.label)).toEqual([
      "Session 12 · The Old Mill · 9 Nov 2026",
      "Session 7 · Gilded Stag",
      "Session 2 · 14 Mar 2026",
      "Session 1",
    ]);
  });

  it("lists two sessions sharing a number by their file", () => {
    const choices = sessionChoicesOf([{ path: "Pale Moon/Sessions/Session 3.md", number: 3 }, { path: "Pale Moon/Sessions/Session 03.md", number: 3 }], propertiesOf);
    expect(choices.map((choice) => choice.path)).toEqual(["Pale Moon/Sessions/Session 03.md", "Pale Moon/Sessions/Session 3.md"]);
  });
});

describe("sessionChoiceOf", () => {
  it("heads a session with its name and title, leaving the date to the list", () => {
    expect(sessionChoiceOf("Pale Moon/Sessions/Session 12.md", propertiesOf).heading).toBe("Session 12 · The Old Mill");
    expect(sessionChoiceOf("Pale Moon/Sessions/Session 2.md", propertiesOf).heading).toBe("Session 2");
  });
});

describe("sessionShown", () => {
  it("shows the session asked for", () => {
    expect(sessionShown("Pale Moon/Sessions/Session 2.md", "Pale Moon", [session(2), session(12)])).toBe("Pale Moon/Sessions/Session 2.md");
  });

  it("shows the latest session when none is asked for", () => {
    expect(sessionShown(null, "Pale Moon", [session(2), session(12), session(7)])).toBe("Pale Moon/Sessions/Session 12.md");
  });

  it("shows none when two share the latest number, without a campaign, or without sessions", () => {
    const shared = [session(2), { path: "Pale Moon/Sessions/Session 02.md", number: 2 }];
    expect(sessionShown(null, "Pale Moon", shared)).toBeNull();
    expect(sessionShown(null, null, [session(2)])).toBeNull();
    expect(sessionShown(null, "Pale Moon", [])).toBeNull();
  });
});
