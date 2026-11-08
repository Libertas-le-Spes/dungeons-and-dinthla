import { StateField } from "@codemirror/state";
import type {
  AbstractInputSuggest as RealInputSuggest,
  FrontMatterInfo,
  ItemView as RealItemView,
  MarkdownFileInfo,
  Modal as RealModal,
  Plugin as RealPlugin,
} from "obsidian";

export class Plugin {
  app: RealPlugin["app"];
  manifest: RealPlugin["manifest"];

  constructor(...[app, manifest]: ConstructorParameters<typeof RealPlugin>) {
    this.app = app;
    this.manifest = manifest;
  }
}

export class ItemView {
  leaf: RealItemView["leaf"];
  contentEl!: HTMLElement;

  constructor(...[leaf]: ConstructorParameters<typeof RealItemView>) {
    this.leaf = leaf;
  }

  registerDomEvent(element: HTMLElement, type: string, callback: (event: Event) => void): void {
    element.addEventListener(type, callback);
  }

  register(): void {}
}

const PROPERTIES_OPEN = /^---\r?\n/;

export function getFrontMatterInfo(content: string): FrontMatterInfo {
  const none = { exists: false, frontmatter: "", from: 0, to: 0, contentStart: 0 };
  const opening = PROPERTIES_OPEN.exec(content);
  if (opening === null) return none;
  const from = opening[0].length;
  const closing = /^---(?:\r?\n|$)/gm;
  closing.lastIndex = from;
  const close = closing.exec(content);
  if (close === null) return none;
  return {
    exists: true,
    frontmatter: content.slice(from, close.index),
    from,
    to: close.index,
    contentStart: close.index + close[0].length,
  };
}

export const editorInfoField = StateField.define<MarkdownFileInfo>({
  create: () => ({ file: null }) as unknown as MarkdownFileInfo,
  update: (info) => info,
});

export class Modal {
  app: RealModal["app"];

  constructor(...[app]: ConstructorParameters<typeof RealModal>) {
    this.app = app;
  }
}

export class AbstractInputSuggest {
  app: RealInputSuggest<unknown>["app"];

  constructor(...[app]: ConstructorParameters<typeof RealInputSuggest>) {
    this.app = app;
  }
}
