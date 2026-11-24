import type { ViewElement } from "../../../views/elements/view-element";
import { ElementPlace } from "./element-place";
import { ObsidianMounter } from "./obsidian-mounter";

export function mountTree(tree: ViewElement, into: HTMLElement): void {
  tree.mountOn(new ObsidianMounter(), new ElementPlace(into));
}
