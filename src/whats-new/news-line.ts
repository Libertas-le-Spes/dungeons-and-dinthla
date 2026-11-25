import type { Telling } from "../host/showing/telling";
import { messageOf } from "../views/dialogs/message-of";
import type { ShowPage } from "../interface/view/page-target";
import { HandleRequest, PressBinding } from "../views/elements/bindings/bindings";
import { KeptHandle } from "../views/elements/bindings/kept-handle";
import { RunAction } from "../views/elements/bindings/run-action";
import { Button, Div, Span } from "../views/elements/kinds/containers";
import type { ViewElement } from "../views/elements/view-element";
import type { News, NewsItem } from "./news-item";

export const SHOW_ME = "Show me";
export const DISMISS = "Dismiss";

function separator(): ViewElement {
  return new Span({ cls: ["dd-news-separator"], text: "·", hiddenFromReaders: true });
}

export class NewsLine {
  private readonly line = new KeptHandle();

  constructor(
    private readonly news: News,
    private readonly show: ShowPage,
    private readonly telling: Pick<Telling, "say">,
  ) {}

  tree(): ViewElement {
    const item = this.news.latest();
    const handle = new HandleRequest(this.line);
    if (item === null) return new Div({ cls: ["dd-news"], hidden: true, bindings: [handle] });
    return new Div({ cls: ["dd-news"], bindings: [handle] }, [
      new Span({ cls: ["dd-news-label"], text: "New:" }),
      new Span({ cls: ["dd-news-text"], text: item.sentence }),
      separator(),
      this.button(SHOW_ME, this.showMe.bind(this, item)),
      separator(),
      this.button(DISMISS, this.close.bind(this)),
    ]);
  }

  private button(text: string, pressed: () => void): ViewElement {
    return new Button({ cls: ["dd-news-button"], text, bindings: [new PressBinding(new RunAction(pressed))] });
  }

  private showMe(item: NewsItem): void {
    this.close();
    this.show({ page: item.page, path: null });
  }

  private close(): void {
    this.line.setHidden(true);
    this.news.seen().catch(this.seenFailed.bind(this));
  }

  private seenFailed(error: unknown): void {
    this.telling.say(`Couldn't keep that the news was seen: ${messageOf(error)}`);
  }
}
