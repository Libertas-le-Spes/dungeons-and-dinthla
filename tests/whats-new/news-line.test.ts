import { beforeEach, describe, expect, it, vi } from "vitest";
import type { News, NewsItem } from "../../src/whats-new/news-item";
import { NewsLine } from "../../src/whats-new/news-line";
import { Notice } from "../stubs/obsidian";
import { isShown, obsidianDocument } from "../stubs/obsidian-dom";

const LANTERNS: NewsItem = { sentence: "Lanterns now light the party funds.", page: "funds" };

function lineWith(latest: NewsItem | null, seen: () => Promise<void> = async () => {}) {
  const news: News = { latest: () => latest, seen: vi.fn(seen) };
  const show = vi.fn();
  const lineEl = obsidianDocument().body.createDiv();
  const line = new NewsLine(lineEl, news, show);
  line.load();
  return { lineEl, news, show, line };
}

function buttonNamed(lineEl: HTMLElement, text: string): HTMLButtonElement {
  const button = [...lineEl.querySelectorAll("button")].find((each) => each.textContent === text);
  if (button === undefined) throw new Error(`No button ${text}`);
  return button;
}

describe("NewsLine", () => {
  beforeEach(() => {
    Notice.shown = [];
  });

  it("says so when it can't keep that the news was seen", async () => {
    const { lineEl } = lineWith(LANTERNS, async () => {
      throw new Error("data.json is read-only.");
    });
    buttonNamed(lineEl, "Dismiss").click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(Notice.shown).toEqual(["Couldn't keep that the news was seen: data.json is read-only."]);
  });

  it("says what is new, with Show me and Dismiss", () => {
    const { lineEl } = lineWith(LANTERNS);
    expect(isShown(lineEl)).toBe(true);
    expect(lineEl.textContent).toBe("New:Lanterns now light the party funds.·Show me·Dismiss");
  });

  it("stays hidden when there is no news", () => {
    const { lineEl } = lineWith(null);
    expect(isShown(lineEl)).toBe(false);
    expect(lineEl.textContent).toBe("");
  });

  it("goes to the page the news is about with Show me, marking it seen and hiding the line", () => {
    const { lineEl, news, show } = lineWith(LANTERNS);
    buttonNamed(lineEl, "Show me").click();
    expect(show).toHaveBeenCalledExactlyOnceWith({ page: "funds", path: null });
    expect(news.seen).toHaveBeenCalledOnce();
    expect(isShown(lineEl)).toBe(false);
  });

  it("marks the news seen and hides the line with Dismiss, staying on the dashboard", () => {
    const { lineEl, news, show } = lineWith(LANTERNS);
    buttonNamed(lineEl, "Dismiss").click();
    expect(news.seen).toHaveBeenCalledOnce();
    expect(show).not.toHaveBeenCalled();
    expect(isShown(lineEl)).toBe(false);
  });
});
