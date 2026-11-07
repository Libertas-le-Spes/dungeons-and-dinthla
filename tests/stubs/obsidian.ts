import type { FrontMatterInfo, ItemView as RealItemView, Plugin as RealPlugin } from "obsidian";

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

  constructor(...[leaf]: ConstructorParameters<typeof RealItemView>) {
    this.leaf = leaf;
  }
}

const PROPERTIES = /^---\r?\n([\s\S]*?)\r?\n---(?=\r?\n|$)/;

export function getFrontMatterInfo(content: string): FrontMatterInfo {
  const match = PROPERTIES.exec(content);
  if (match === null) return { exists: false, frontmatter: "", from: 0, to: 0, contentStart: 0 };
  const from = content.indexOf("\n") + 1;
  return { exists: true, frontmatter: match[1]!, from, to: from + match[1]!.length, contentStart: match[0].length };
}
