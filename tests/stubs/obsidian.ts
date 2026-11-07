import type { ItemView as RealItemView, Plugin as RealPlugin } from "obsidian";

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
