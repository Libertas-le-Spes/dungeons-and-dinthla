import { describe, expect, it, vi } from "vitest";
import type { News, NewsItem } from "../../src/whats-new/news-item";
import { NewsLine } from "../../src/whats-new/news-line";
import { isShown, obsidianDocument } from "../stubs/obsidian-dom";
import { mountTree } from "../../src/obsidian/views/mount/mount-tree";
import { RecordedTelling } from "../host/showing/recorded-telling";

const LANTERNS: NewsItem = { sentence: "Lanterns now light the party funds.", page: "funds" };

function lineWith(latest: NewsItem | null, seen: () => Promise<void> = async () => {}) {
  const seenMock = vi.fn(seen);
  const news: News = { latest: () => latest, seen: seenMock };
  const show = vi.fn();
  const telling = new RecordedTelling();
  const parent = obsidianDocument().body.createDiv();
  mountTree(new NewsLine(news, show, telling).tree(), parent);
  const lineEl = parent.firstElementChild as HTMLElement;
  return { lineEl, news, show, telling, seenMock };
}

function buttonNamed(lineEl: HTMLElement, text: string): HTMLButtonElement {
  const button = [...lineEl.querySelectorAll("button")].find((each) => each.textContent === text);
  if (button === undefined) throw new Error(`No button ${text}`);
  return button;
}

describe("NewsLine", () => {
  it("says so when it can't keep that the news was seen", async () => {
    const { lineEl, telling, seenMock } = lineWith(LANTERNS, async () => {
      throw new Error("data.json is read-only.");
    });
    buttonNamed(lineEl, "Dismiss").click();
    await expect(seenMock.mock.results[0]!.value).rejects.toThrow("data.json is read-only.");
    expect(telling.said).toEqual(["Couldn't keep that the news was seen: data.json is read-only."]);
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
