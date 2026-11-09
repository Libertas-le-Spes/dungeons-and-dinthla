import { describe, expect, it } from "vitest";
import type { CachedMetadata, TFile } from "obsidian";
import type { BackgroundMetadata } from "../../src/campaign/campaign-background";
import { BackgroundRefresh, showBackground, shownBackgroundOf } from "../../src/reading/note-background";
import { pictureOf, shownPicture } from "../campaign/shown-picture";
import { obsidianDocument } from "../views/obsidian-dom";

const FOLDERS = ["Ashen Road", "Pale Moon"];

function metadataWith(caches: Record<string, CachedMetadata>): BackgroundMetadata {
  return {
    getCache: (path) => {
      const cache = caches[path];
      if (cache === undefined) return null;
      return cache;
    },
    getFirstLinkpathDest: (linkpath) => ({ path: `Art/${linkpath}`, extension: "jpg" }) as TFile,
  };
}

const PALE_MOON: CachedMetadata = {
  frontmatter: { background: "[[pale-moon.jpg]]", wash: "strong" },
  frontmatterLinks: [{ key: "background", link: "pale-moon.jpg", original: "[[pale-moon.jpg]]" }],
};
const metadata = metadataWith({ "Pale Moon/Pale Moon.md": PALE_MOON, "Ashen Road/Ashen Road.md": {} });
const urlOf = (picture: TFile) => `app://vault/${picture.path}`;

describe("shownBackgroundOf", () => {
  it("shows the campaign's picture behind a note in one of its folders", () => {
    const shown = shownBackgroundOf("Pale Moon/Sessions/Session 1.md", FOLDERS, metadata, urlOf);
    expect(shown!.picture.value).toBe('url("app://vault/Art/pale-moon.jpg")');
    expect(shown!.wash).toBe("strong");
  });

  it("puts a picture named with quotes and brackets safely inside one url", () => {
    const named = (picture: TFile) => `app://vault/${picture.path}"), url("https://elsewhere.example/t.png`;
    const shown = shownBackgroundOf("Pale Moon/Sessions/Session 1.md", FOLDERS, metadata, named);
    expect(shown!.picture.value).toBe('url("app://vault/Art/pale-moon.jpg%22%29,%20url%28%22https://elsewhere.example/t.png")');
  });

  it("shows nothing when the picture's address isn't one Obsidian gives on this platform", () => {
    const remote = (picture: TFile) => `https://elsewhere.example/${picture.path}`;
    expect(shownBackgroundOf("Pale Moon/Sessions/Session 1.md", FOLDERS, metadata, remote)).toBeNull();
  });

  it("shows nothing behind a note outside every campaign", () => {
    expect(shownBackgroundOf("Recipes/Bread.md", FOLDERS, metadata, urlOf)).toBeNull();
  });

  it("shows nothing behind a note of a campaign without a picture", () => {
    expect(shownBackgroundOf("Ashen Road/Sessions/Session 1.md", FOLDERS, metadata, urlOf)).toBeNull();
  });
});

describe("showBackground", () => {
  function contentWithNote(): HTMLElement {
    const contentEl = obsidianDocument().body.createDiv();
    contentEl.createDiv({ cls: "markdown-source-view" });
    return contentEl;
  }
  const layersIn = (contentEl: HTMLElement) => contentEl.querySelectorAll<HTMLElement>(".dd-campaign-background");

  it("puts the picture behind the note, under the chosen wash", () => {
    const contentEl = contentWithNote();
    showBackground(contentEl, shownPicture("app://vault/pale-moon.jpg", "subtle"));
    const layer = contentEl.firstElementChild as HTMLElement;
    expect(layer.className).toBe("dd-tokens dd-campaign-background dd-wash-subtle");
    expect(pictureOf(layer)).toBe('url("app://vault/pale-moon.jpg")');
    expect(contentEl.classList.contains("dd-has-campaign-background")).toBe(true);
  });

  it("changes the picture and wash in place rather than stacking another", () => {
    const contentEl = contentWithNote();
    showBackground(contentEl, shownPicture("app://vault/pale-moon.jpg", "subtle"));
    showBackground(contentEl, shownPicture("app://vault/ashen-road.jpg", "strong"));
    const layers = layersIn(contentEl);
    expect(layers).toHaveLength(1);
    expect(layers[0]!.className).toBe("dd-tokens dd-campaign-background dd-wash-strong");
    expect(pictureOf(layers[0]!)).toBe('url("app://vault/ashen-road.jpg")');
  });

  it("restores the plain background when the picture is removed", () => {
    const contentEl = contentWithNote();
    showBackground(contentEl, shownPicture("app://vault/pale-moon.jpg", "balanced"));
    showBackground(contentEl, null);
    expect(layersIn(contentEl)).toHaveLength(0);
    expect(contentEl.classList.contains("dd-has-campaign-background")).toBe(false);
    expect(contentEl.children).toHaveLength(1);
  });

  it("leaves a note that never had a picture as it was", () => {
    const contentEl = contentWithNote();
    showBackground(contentEl, null);
    expect(contentEl.outerHTML).toBe('<div class=""><div class="markdown-source-view"></div></div>');
  });
});

describe("BackgroundRefresh", () => {
  function counted() {
    const counter = { runs: 0 };
    const refresh = new BackgroundRefresh(() => {
      counter.runs += 1;
    });
    return { refresh, counter };
  }

  it("redraws when a campaign's main note changes", () => {
    const { refresh, counter } = counted();
    refresh.noteChanged("Pale Moon/Pale Moon.md");
    expect(counter.runs).toBe(1);
  });

  it("leaves the backgrounds alone when any other note changes", () => {
    const { refresh, counter } = counted();
    refresh.noteChanged("Pale Moon/Sessions/Session 1.md");
    expect(counter.runs).toBe(0);
  });

  it("redraws when notes open or files move", () => {
    const { refresh, counter } = counted();
    refresh.layoutChanged();
    expect(counter.runs).toBe(1);
  });
});
