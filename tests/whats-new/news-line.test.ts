import { describe, expect, it, vi } from "vitest";
import type { News, NewsItem } from "../../src/whats-new/news-item";
import { NewsLine } from "../../src/whats-new/news-line";
import { isShown, obsidianDocument } from "../views/obsidian-dom";

const LANTERNS: NewsItem = { sentence: "Lanterns now light the party funds.", page: "funds" };

function lineWith(latest: NewsItem | null) {
  const news: News = { latest: () => latest, seen: vi.fn(async () => {}) };
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
