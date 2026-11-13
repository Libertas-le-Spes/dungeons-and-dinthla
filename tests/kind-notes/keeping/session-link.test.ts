import { describe, expect, it, vi } from "vitest";
import { linksToSession, sessionLinkFor } from "../../../src/kind-notes/keeping/session-link";
import { fileAt } from "../fake-notes";

const NOTE = "D&D/Pale Moon/Questions/Session 2.md";
const SESSION = "D&D/Pale Moon/Sessions/Session 2.md";

function resolvedAt(found: string | null) {
  if (found === null) return null;
  return fileAt(found);
}

function metadataResolving(found: string | null) {
  const resolved = resolvedAt(found);
  return {
    fileToLinktext: vi.fn(() => "Session 2"),
    getFirstLinkpathDest: vi.fn(() => resolved),
  };
}

describe("sessionLinkFor", () => {
  it("is the link text Obsidian gives from the note to the session, without the ending", () => {
    const metadata = metadataResolving(SESSION);
    const file = fileAt(SESSION);
    expect(sessionLinkFor(metadata, file, NOTE)).toBe("[[Session 2]]");
    expect(metadata.fileToLinktext).toHaveBeenCalledExactlyOnceWith(file, NOTE, true);
  });
});

describe("linksToSession for a session that is there", () => {
  const session = { path: SESSION, file: fileAt(SESSION) };

  it("is true when the one link resolves to the session, however it is written", () => {
    for (const property of ["[[Session 2]]", "[[Session 2|the second]]", "[[Session 2#Start]]"]) {
      expect(linksToSession(metadataResolving(SESSION), property, NOTE, session)).toBe(true);
    }
  });

  it("asks Obsidian to resolve the link from the note's own place", () => {
    const metadata = metadataResolving(SESSION);
    linksToSession(metadata, "[[Session 2]]", NOTE, session);
    expect(metadata.getFirstLinkpathDest).toHaveBeenCalledExactlyOnceWith("Session 2", NOTE);
  });

  it("is false when the link resolves to another note, or to none", () => {
    expect(linksToSession(metadataResolving("D&D/Dark Tide/Sessions/Session 2.md"), "[[Session 2]]", NOTE, session)).toBe(false);
    expect(linksToSession(metadataResolving(null), "[[Session 2]]", NOTE, session)).toBe(false);
  });

  it("is false for what isn't a text, holds no link, or holds two", () => {
    const metadata = metadataResolving(SESSION);
    expect(linksToSession(metadata, 2, NOTE, session)).toBe(false);
    expect(linksToSession(metadata, "Session 2", NOTE, session)).toBe(false);
    expect(linksToSession(metadata, "[[Session 2]] [[Session 3]]", NOTE, session)).toBe(false);
    expect(metadata.getFirstLinkpathDest).not.toHaveBeenCalled();
  });
});

describe("linksToSession for a session that is gone", () => {
  const gone = { path: SESSION, file: null };

  it("is true when the link names the session by its name or its whole path", () => {
    expect(linksToSession(metadataResolving(null), "[[Session 2]]", NOTE, gone)).toBe(true);
    expect(linksToSession(metadataResolving(null), "[[D&D/Pale Moon/Sessions/Session 2]]", NOTE, gone)).toBe(true);
    expect(linksToSession(metadataResolving(null), "[[Sessions/Session 2]]", NOTE, gone)).toBe(true);
  });

  it("is false when the link names the tail of another name, such as Old Session 2", () => {
    const other = { path: "D&D/Pale Moon/Sessions/Old Session 2.md", file: null };
    expect(linksToSession(metadataResolving(null), "[[Session 2]]", NOTE, other)).toBe(false);
  });

  it("is false when the link names another session", () => {
    expect(linksToSession(metadataResolving(null), "[[Session 3]]", NOTE, gone)).toBe(false);
  });
});
