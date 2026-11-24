import type { ElementParts } from "../element-parts";
import type { Mounter, MountPlace } from "../mounter";
import type { ViewElement } from "../view-element";

export interface Field extends ElementParts {
  readonly value?: string;
  readonly placeholder?: string;
  readonly spellcheck?: boolean;
}

export class TextInput implements ViewElement {
  constructor(readonly parts: Field) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mounter.textInput(this, into);
  }
}

export class TextArea implements ViewElement {
  constructor(
    readonly parts: Field,
    readonly rows: number | null = null,
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mounter.textArea(this, into);
  }
}

export class Option implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly value: string,
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mounter.option(this, into);
  }
}
