import type { TFile } from "obsidian";
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
    getFirstLinkpathDest: vi.fn(() => resolved),
  };
}

describe("sessionLinkFor", () => {
  it("is the whole path of the session in the vault, without the ending, so no other note can be meant", () => {
    expect(sessionLinkFor(fileAt(SESSION))).toBe("[[D&D/Pale Moon/Sessions/Session 2]]");
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

  it("is true whatever the capitals, and with the ending written", () => {
    expect(linksToSession(metadataResolving(null), "[[session 2]]", NOTE, gone)).toBe(true);
    expect(linksToSession(metadataResolving(null), "[[D&D/Pale Moon/SESSIONS/Session 2.md]]", NOTE, gone)).toBe(true);
    expect(linksToSession(metadataResolving(null), "[[Session 2.MD]]", NOTE, gone)).toBe(true);
  });

  it("is false when the link names the tail of another name, such as Old Session 2", () => {
    const other = { path: "D&D/Pale Moon/Sessions/Old Session 2.md", file: null };
    expect(linksToSession(metadataResolving(null), "[[Session 2]]", NOTE, other)).toBe(false);
  });

  it("is false when the link names another session", () => {
    expect(linksToSession(metadataResolving(null), "[[Session 3]]", NOTE, gone)).toBe(false);
  });
});

const VAULT = ["Sessions", "Questions", "Funds", "Quests"].map((folder) => `D&D/Pale Moon/${folder}/Session 3.md`);

function folderOf(path: string): string {
  return path.slice(0, path.lastIndexOf("/"));
}

function resolvedFrom(target: string, source: string): TFile | null {
  const named = VAULT.filter((path) => path.replace(/\.md$/, "").toLowerCase().endsWith(target.toLowerCase()));
  const here = named.find((path) => folderOf(path) === folderOf(source));
  if (here !== undefined) return fileAt(here);
  const [first] = named;
  if (first === undefined) return null;
  return fileAt(first);
}

const obsidian = { getFirstLinkpathDest: resolvedFrom };

describe("linksToSession in a vault with a session note and three kind notes of the same number", () => {
  const SESSION_THREE = "D&D/Pale Moon/Sessions/Session 3.md";
  const session = { path: SESSION_THREE, file: fileAt(SESSION_THREE) };
  const KIND_NOTES = VAULT.filter((path) => path !== SESSION_THREE);
  const QUESTIONS_THREE = "D&D/Pale Moon/Questions/Session 3.md";

  it("resolves the short link from each kind note's own folder to the kind note itself", () => {
    for (const path of KIND_NOTES) expect(resolvedFrom("Session 3", path)?.path).toBe(path);
  });

  it("is true for the short link an earlier version wrote, in each kind note", () => {
    for (const path of KIND_NOTES) expect(linksToSession(obsidian, "[[Session 3]]", path, session)).toBe(true);
  });

  it("is true for the whole path, in each kind note", () => {
    for (const path of KIND_NOTES) expect(linksToSession(obsidian, "[[D&D/Pale Moon/Sessions/Session 3]]", path, session)).toBe(true);
  });

  it("is true for the short link in other capitals, in each kind note", () => {
    for (const path of KIND_NOTES) expect(linksToSession(obsidian, "[[SESSION 3]]", path, session)).toBe(true);
  });

  it("is true for a link the session's own folder name qualifies", () => {
    for (const path of KIND_NOTES) expect(linksToSession(obsidian, "[[Sessions/Session 3]]", path, session)).toBe(true);
  });

  it("is false for a link that names the kind note itself by its path", () => {
    expect(linksToSession(obsidian, "[[D&D/Pale Moon/Questions/Session 3]]", QUESTIONS_THREE, session)).toBe(false);
  });

  it("is false for a short link to a different session, which resolves to nothing here", () => {
    for (const path of KIND_NOTES) expect(linksToSession(obsidian, "[[Session 4]]", path, session)).toBe(false);
  });

  it("is false when the short link resolves to the note itself but the note belongs to another session", () => {
    const four = { path: "D&D/Pale Moon/Sessions/Session 4.md", file: fileAt("D&D/Pale Moon/Sessions/Session 4.md") };
    expect(linksToSession(obsidian, "[[Session 3]]", QUESTIONS_THREE, four)).toBe(false);
  });

  it("is false for a short link named like the session's tail, such as Old Session 3", () => {
    const old = { path: "D&D/Pale Moon/Sessions/Old Session 3.md", file: fileAt("D&D/Pale Moon/Sessions/Old Session 3.md") };
    for (const path of KIND_NOTES) expect(linksToSession(obsidian, "[[Session 3]]", path, old)).toBe(false);
  });
});
