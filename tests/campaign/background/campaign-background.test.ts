import { describe, expect, it } from "vitest";
import type { CachedMetadata, TFile } from "obsidian";
import {
  backgroundOf,
  choosePicture,
  chooseWash,
  removePicture,
  washOf,
  type BackgroundFileActions,
  type BackgroundMetadata,
} from "../../../src/campaign/background/campaign-background";

const MAIN_NOTE = "Pale Moon/Pale Moon.md";

function fileAt(path: string): TFile {
  const name = path.slice(path.lastIndexOf("/") + 1);
  return { path, name, extension: name.slice(name.lastIndexOf(".") + 1) } as TFile;
}

function metadataWith(cache: CachedMetadata | null, files: string[]): BackgroundMetadata {
  return {
    getCache: (path) => {
      if (path !== MAIN_NOTE) return null;
      return cache;
    },
    getFirstLinkpathDest: (linkpath) => {
      const path = files.find((file) => file.endsWith(linkpath));
      if (path === undefined) return null;
      return fileAt(path);
    },
  };
}

function backgroundLink(link: string): CachedMetadata {
  return {
    frontmatter: { background: `[[${link}]]` },
    frontmatterLinks: [{ key: "background", link, original: `[[${link}]]` }],
  };
}

describe("backgroundOf", () => {
  it("finds the picture the main note's background property links to", () => {
    const metadata = metadataWith(backgroundLink("pale-moon.jpg"), ["Art/pale-moon.jpg"]);
    expect(backgroundOf("Pale Moon", metadata).picture?.path).toBe("Art/pale-moon.jpg");
  });

  it("knows a picture whatever the case of its extension", () => {
    const metadata = metadataWith(backgroundLink("pale-moon.PNG"), ["pale-moon.PNG"]);
    expect(backgroundOf("Pale Moon", metadata).picture?.path).toBe("pale-moon.PNG");
  });

  it("has no picture when the campaign has no main note yet", () => {
    expect(backgroundOf("Pale Moon", metadataWith(null, []))).toEqual({ picture: null, wash: "balanced" });
  });

  it("has no picture when the main note links nothing in its properties", () => {
    expect(backgroundOf("Pale Moon", metadataWith({ frontmatter: { wash: "strong" } }, [])).picture).toBeNull();
  });

  it("has no picture when the properties link something else", () => {
    const cache: CachedMetadata = { frontmatterLinks: [{ key: "system", link: "pale-moon.jpg", original: "[[pale-moon.jpg]]" }] };
    expect(backgroundOf("Pale Moon", metadataWith(cache, ["pale-moon.jpg"])).picture).toBeNull();
  });

  it("has no picture when the linked picture isn't in the vault", () => {
    expect(backgroundOf("Pale Moon", metadataWith(backgroundLink("gone.jpg"), [])).picture).toBeNull();
  });

  it("has no picture when the background links a note rather than a picture", () => {
    const metadata = metadataWith(backgroundLink("Mira.md"), ["Pale Moon/Characters/Mira.md"]);
    expect(backgroundOf("Pale Moon", metadata).picture).toBeNull();
  });

  it("reads how much of the picture shows", () => {
    const cache: CachedMetadata = { frontmatter: { wash: "strong" } };
    expect(backgroundOf("Pale Moon", metadataWith(cache, [])).wash).toBe("strong");
  });

  it("shows a balanced amount when the main note has no properties", () => {
    expect(backgroundOf("Pale Moon", metadataWith({}, [])).wash).toBe("balanced");
  });
});

describe("washOf", () => {
  it("keeps each wash it knows", () => {
    for (const wash of ["subtle", "balanced", "strong"]) expect(washOf(wash)).toBe(wash);
  });

  it("falls back to balanced for anything else", () => {
    for (const value of ["Strong", "bold", 3, null, undefined]) expect(washOf(value)).toBe("balanced");
  });
});

describe("writing the background", () => {
  function fileManagerWith(properties: Record<string, unknown>): BackgroundFileActions {
    return {
      processFrontMatter: async (_file, change) => {
        change(properties);
      },
    };
  }
  const mainNote = fileAt(MAIN_NOTE);

  it("links the chosen picture in the background property", async () => {
    const properties: Record<string, unknown> = { role: "player" };
    await choosePicture(fileManagerWith(properties), mainNote, "pale-moon.jpg");
    expect(properties).toEqual({ role: "player", background: "[[pale-moon.jpg]]" });
  });

  it("removes the background property and nothing else", async () => {
    const properties: Record<string, unknown> = { role: "player", background: "[[pale-moon.jpg]]", wash: "strong" };
    await removePicture(fileManagerWith(properties), mainNote);
    expect(properties).toEqual({ role: "player", wash: "strong" });
  });

  it("sets how much of the picture shows", async () => {
    const properties: Record<string, unknown> = {};
    await chooseWash(fileManagerWith(properties), mainNote, "subtle");
    expect(properties).toEqual({ wash: "subtle" });
  });
});
