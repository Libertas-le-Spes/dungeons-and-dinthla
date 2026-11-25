import { describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import { castPageFor, type CastPages } from "../../../src/characters/pages/cast-page-for";

const MIRA = { path: "Pale Moon/Characters/Mira.md", basename: "Mira" } as TFile;
const GALLERY = "gallery";
const CHARACTER = "character";
const FALLEN = "fallen";
const BRANN = { path: "Pale Moon/Fallen/Brann.md", basename: "Brann" } as TFile;

function pagesWith(files: TFile[]) {
  const fileAt = vi.fn((path: string) => {
    const file = files.find((candidate) => candidate.path === path);
    if (file === undefined) return null;
    return file;
  });
  const pages: CastPages<string> = {
    notes: { fileAt, campaignFolders: () => ["Pale Moon"] },
    gallery: vi.fn(() => GALLERY),
    character: vi.fn(() => CHARACTER),
    fallen: vi.fn(() => FALLEN),
  };
  return { pages, fileAt };
}

describe("castPageFor", () => {
  it("shows a character's sheet for their note", () => {
    const { pages } = pagesWith([MIRA]);
    expect(castPageFor(MIRA.path, pages)).toBe(CHARACTER);
    expect(pages.character).toHaveBeenCalledExactlyOnceWith(MIRA);
    expect(pages.gallery).not.toHaveBeenCalled();
  });

  it("shows a fallen character's page for their note in the Fallen folder", () => {
    const { pages } = pagesWith([BRANN]);
    expect(castPageFor(BRANN.path, pages)).toBe(FALLEN);
    expect(pages.fallen).toHaveBeenCalledExactlyOnceWith(BRANN);
    expect(pages.character).not.toHaveBeenCalled();
  });

  it("shows the gallery for a fallen character's note that is gone", () => {
    const { pages, fileAt } = pagesWith([]);
    expect(castPageFor(BRANN.path, pages)).toBe(GALLERY);
    expect(fileAt).toHaveBeenCalledExactlyOnceWith(BRANN.path);
    expect(pages.fallen).not.toHaveBeenCalled();
  });

  it.each(["Pale Moon/Fallen/Old/Brann.md", "Pale Moon/Fallen/Brann.base", "Ashen Road/Fallen/Brann.md"])("shows the gallery for %s, without looking it up", (path) => {
    const { pages, fileAt } = pagesWith([]);
    expect(castPageFor(path, pages)).toBe(GALLERY);
    expect(fileAt).not.toHaveBeenCalled();
  });

  it("shows the gallery with no note", () => {
    const { pages } = pagesWith([MIRA]);
    expect(castPageFor(null, pages)).toBe(GALLERY);
    expect(pages.gallery).toHaveBeenCalledOnce();
  });

  it("shows the gallery for the Characters base, without looking it up as a character", () => {
    const { pages, fileAt } = pagesWith([MIRA]);
    expect(castPageFor("Pale Moon/Characters.base", pages)).toBe(GALLERY);
    expect(fileAt).not.toHaveBeenCalled();
  });

  it("shows the gallery for a character's note that is gone", () => {
    const { pages, fileAt } = pagesWith([]);
    expect(castPageFor(MIRA.path, pages)).toBe(GALLERY);
    expect(fileAt).toHaveBeenCalledExactlyOnceWith(MIRA.path);
  });
});
