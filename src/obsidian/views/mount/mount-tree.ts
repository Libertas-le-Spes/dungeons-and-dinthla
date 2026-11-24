import type { ViewElement } from "../../../views/elements/view-element";
import { ElementPlace } from "./element-place";
import { PLAIN_KIT, type MountKit } from "./mount-kit";
import { ObsidianMounter } from "./obsidian-mounter";

export function mountTree(tree: ViewElement, into: HTMLElement, kit: MountKit = PLAIN_KIT): void {
  tree.mountOn(new ObsidianMounter(kit), new ElementPlace(into));
}
