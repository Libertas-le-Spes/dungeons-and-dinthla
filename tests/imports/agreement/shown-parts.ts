import { mountTree } from "../../../src/obsidian/views/mount/mount-tree";
import type { ViewElement } from "../../../src/views/elements/view-element";

export function textsIn(parentEl: HTMLElement, selector: string): string[] {
  const found: string[] = [];
  for (const element of parentEl.querySelectorAll(selector)) found.push(String(element.textContent));
  return found;
}

export function pressOn(parentEl: HTMLElement, words: string): void {
  for (const button of parentEl.querySelectorAll("button")) {
    if (button.textContent === words) {
      button.click();
      return;
    }
  }
  throw new Error(`No button says ${words}.`);
}

export function mountedIn(parentEl: HTMLElement, trees: readonly ViewElement[]): void {
  for (const tree of trees) mountTree(tree, parentEl);
}
