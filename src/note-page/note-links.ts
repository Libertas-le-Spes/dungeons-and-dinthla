import { splitLinks, type LinkedText } from "../notes/parts/link";
import { LinkName, type LinkOpener } from "../views/components/rows/link-name";
import { HandleRequest } from "../views/elements/bindings/bindings";
import { KeptHandle } from "../views/elements/bindings/kept-handle";
import { Heading3, List, ListItem, Section } from "../views/elements/kinds/containers";
import type { ViewElement } from "../views/elements/view-element";

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
  private readonly section = new KeptHandle();
  private readonly list = new KeptHandle();

  constructor(
    private readonly sourcePath: string,
    private readonly opener: LinkOpener,
  ) {}

  tree(): ViewElement {
    return new Section({ cls: ["dd-note-links"], bindings: [new HandleRequest(this.section)] }, [
      new Heading3({ cls: ["dd-note-links-title"], text: HEADING }),
      new List({ cls: ["dd-note-links-list"], bindings: [new HandleRequest(this.list)] }),
    ]);
  }

  show(text: string): void {
    const links = linksIn(text);
    const items: ViewElement[] = [];
    for (const link of links) items.push(new ListItem({}, [new LinkName(link.linktext, this.sourcePath, this.opener).build(link.text)]));
    this.list.showInside(items);
    this.section.setHidden(links.length === 0);
  }
}
