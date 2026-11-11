import { Component, Notice } from "obsidian";
import { messageOf } from "../views/dialogs/message-of";
import type { ShowPage } from "../interface/view/campaign-pages";
import type { News, NewsItem } from "./news-item";

export const SHOW_ME = "Show me";
export const DISMISS = "Dismiss";

export class NewsLine extends Component {
  constructor(
    private readonly lineEl: HTMLElement,
    private readonly news: News,
    private readonly show: ShowPage,
  ) {
    super();
  }

  override onload(): void {
    const item = this.news.latest();
    this.lineEl.empty();
    this.lineEl.toggle(item !== null);
    if (item === null) return;
    this.lineEl.createSpan({ cls: "dd-news-label", text: "New:" });
    this.lineEl.createSpan({ cls: "dd-news-text", text: item.sentence });
    this.addSeparator();
    this.addButton(SHOW_ME, () => this.showMe(item));
    this.addSeparator();
    this.addButton(DISMISS, () => this.close());
  }

  private addSeparator(): void {
    this.lineEl.createSpan({ cls: "dd-news-separator", text: "·", attr: { "aria-hidden": "true" } });
  }

  private addButton(text: string, pressed: () => void): void {
    const button = this.lineEl.createEl("button", { cls: "dd-news-button", text });
    this.registerDomEvent(button, "click", pressed);
  }

  private showMe(item: NewsItem): void {
    this.close();
    this.show({ page: item.page, path: null });
  }

  private close(): void {
    this.lineEl.toggle(false);
    this.news.seen().catch((error: unknown) => new Notice(`Couldn't keep that the news was seen: ${messageOf(error)}`));
  }
}
