import type { ElementParts } from "../element-parts";
import type { Mounter, MountPlace } from "../mounter";
import { mountAll, type ViewElement } from "../view-element";

export class Section implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.section(this, into));
  }
}

export class Div implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.div(this, into));
  }
}

export class Span implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.span(this, into));
  }
}

export class Paragraph implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.paragraph(this, into));
  }
}

export class Button implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.button(this, into));
  }
}

export class List implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.list(this, into));
  }
}

export class OrderedList implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.orderedList(this, into));
  }
}

export class ListItem implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.listItem(this, into));
  }
}

export class Heading1 implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.heading1(this, into));
  }
}

export class Heading2 implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.heading2(this, into));
  }
}

export class Heading3 implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.heading3(this, into));
  }
}

export class Bold implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.bold(this, into));
  }
}

export class Strong implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.strong(this, into));
  }
}

export class Details implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.details(this, into));
  }
}

export class Summary implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.summary(this, into));
  }
}

export class Label implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.label(this, into));
  }
}

export class Anchor implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.anchor(this, into));
  }
}

export class Mark implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.mark(this, into));
  }
}

export class Pre implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.pre(this, into));
  }
}

export class Nav implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.nav(this, into));
  }
}

export class Form implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.form(this, into));
  }
}

export class DescriptionList implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.descriptionList(this, into));
  }
}

export class Term implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.term(this, into));
  }
}

export class Description implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.description(this, into));
  }
}

export class Select implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly children: readonly ViewElement[] = [],
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mountAll(this.children, mounter, mounter.select(this, into));
  }
}
