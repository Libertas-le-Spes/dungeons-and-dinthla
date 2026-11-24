import { FollowBinding } from "../../elements/bindings/bindings";
import type { OpenPlace } from "../../elements/bindings/open-place";
import type { PageAction } from "../../elements/bindings/page-action";
import { NameLink } from "../../elements/kinds/containers";

export interface LinkOpener {
  openLink(linktext: string, sourcePath: string, newTab: boolean): void;
}

class OpenLink implements PageAction {
  constructor(
    private readonly opener: LinkOpener,
    private readonly linktext: string,
    private readonly sourcePath: string,
  ) {}

  run(place: OpenPlace): void {
    this.opener.openLink(this.linktext, this.sourcePath, place.newTab);
  }
}

export class LinkName {
  constructor(
    private readonly linktext: string,
    private readonly sourcePath: string,
    private readonly opener: LinkOpener,
  ) {}

  build(text: string): NameLink {
    const open = new OpenLink(this.opener, this.linktext, this.sourcePath);
    return new NameLink({ cls: ["dd-link-name"], text, role: "link", tabIndex: 0, undraggable: true, bindings: [new FollowBinding(open)] });
  }
}
