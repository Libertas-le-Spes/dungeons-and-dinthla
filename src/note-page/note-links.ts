import { splitLinks, type LinkedText } from "../notes/parts/link";
import { addNameLink, type LinkActions } from "../views/lists/linked-text";

const HEADING = "Links in this note";

interface ShownLink {
  text: string;
  linktext: string;
}

function isLink(part: LinkedText): part is ShownLink {
  return part.linktext !== null;
}

function linksIn(text: string): ShownLink[] {
  const byLinktext = new Map<string, ShownLink>();
  for (const link of splitLinks(text).filter(isLink)) {
    if (!byLinktext.has(link.linktext)) byLinktext.set(link.linktext, link);
  }
  return [...byLinktext.values()];
}

export class NoteLinks {
  private readonly section: HTMLElement;
  private readonly list: HTMLElement;

  constructor(
    parent: HTMLElement,
    private readonly sourcePath: string,
    private readonly actions: LinkActions,
  ) {
    this.section = parent.createEl("section", { cls: "dd-note-links" });
    this.section.createEl("h3", { cls: "dd-note-links-title", text: HEADING });
    this.list = this.section.createEl("ul", { cls: "dd-note-links-list" });
  }

  show(text: string): void {
    const links = linksIn(text);
    this.list.empty();
    this.section.toggle(links.length > 0);
    for (const link of links) this.addLink(link);
  }

  private addLink(link: ShownLink): void {
    addNameLink(this.list.createEl("li"), link.text, link.linktext, this.sourcePath, this.actions);
  }
}
