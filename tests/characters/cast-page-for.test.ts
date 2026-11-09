import { describe, expect, it, vi } from "vitest";
import { Component, type TFile } from "obsidian";
import { castPageFor, type CastPages } from "../../src/characters/cast-page-for";

const MIRA = { path: "Pale Moon/Characters/Mira.md", basename: "Mira" } as TFile;
const GALLERY = new Component();
const CHARACTER = new Component();

function pagesWith(files: TFile[]) {
  const fileAt = vi.fn((path: string) => {
    const file = files.find((candidate) => candidate.path === path);
    if (file === undefined) return null;
    return file;
  });
  const pages: CastPages = {
    notes: { fileAt, campaignFolders: () => ["Pale Moon"] },
    gallery: vi.fn(() => GALLERY),
    character: vi.fn(() => CHARACTER),
  };
  return { pages, fileAt };
}

describe("castPageFor", () => {
  const contentEl = {} as HTMLElement;

  it("shows a character's sheet for their note", () => {
    const { pages } = pagesWith([MIRA]);
    expect(castPageFor(contentEl, MIRA.path, pages)).toBe(CHARACTER);
    expect(pages.character).toHaveBeenCalledExactlyOnceWith(contentEl, MIRA);
    expect(pages.gallery).not.toHaveBeenCalled();
  });

  it("shows the gallery with no note", () => {
    const { pages } = pagesWith([MIRA]);
    expect(castPageFor(contentEl, null, pages)).toBe(GALLERY);
    expect(pages.gallery).toHaveBeenCalledExactlyOnceWith(contentEl);
  });

  it("shows the gallery for the Characters base, without looking it up as a character", () => {
    const { pages, fileAt } = pagesWith([MIRA]);
    expect(castPageFor(contentEl, "Pale Moon/Characters.base", pages)).toBe(GALLERY);
    expect(fileAt).not.toHaveBeenCalled();
  });

  it("shows the gallery for a character's note that is gone", () => {
    const { pages, fileAt } = pagesWith([]);
    expect(castPageFor(contentEl, MIRA.path, pages)).toBe(GALLERY);
    expect(fileAt).toHaveBeenCalledExactlyOnceWith(MIRA.path);
  });
});
