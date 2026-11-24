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

export class DateInput implements ViewElement {
  constructor(readonly parts: Field) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mounter.dateInput(this, into);
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
    readonly chosen: boolean = false,
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mounter.option(this, into);
  }
}

export interface SwitchChange {
  flipped(on: boolean): void;
}

export class Switch implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly on: boolean,
    readonly field: SwitchChange,
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mounter.toggleSwitch(this, into);
  }
}

export interface ChosenFile {
  readonly size: number;
  bytes(): Promise<Uint8Array>;
}

export interface FileChoice {
  chosen(file: ChosenFile): void;
}

export class FileInput implements ViewElement {
  constructor(
    readonly parts: ElementParts,
    readonly field: FileChoice,
  ) {}

  mountOn(mounter: Mounter, into: MountPlace): void {
    mounter.fileInput(this, into);
  }
}
