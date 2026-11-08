import { describe, expect, it } from "vitest";
import { FOLLOW_THEME_CLASS, FollowThemeClass } from "../../src/theme/follow-theme-class";

class FakeBody {
  readonly classes = new Set<string>();

  toggleClass(name: string, on: boolean): void {
    if (on) this.classes.add(name);
    else this.classes.delete(name);
  }

  removeClass(name: string): void {
    this.classes.delete(name);
  }
}

function asBody(body: FakeBody): HTMLElement {
  return body as unknown as HTMLElement;
}

describe("FollowThemeClass", () => {
  it("marks a body as following the theme when a community theme is active", () => {
    const main = new FakeBody();
    new FollowThemeClass(() => true).add(asBody(main));
    expect(main.classes.has(FOLLOW_THEME_CLASS)).toBe(true);
  });

  it("leaves a body unmarked under the default theme", () => {
    const main = new FakeBody();
    new FollowThemeClass(() => false).add(asBody(main));
    expect(main.classes.has(FOLLOW_THEME_CLASS)).toBe(false);
  });

  it("updates every open window when the theme changes", () => {
    let follow = false;
    const themeClass = new FollowThemeClass(() => follow);
    const [main, popout] = [new FakeBody(), new FakeBody()];
    themeClass.add(asBody(main));
    themeClass.add(asBody(popout));
    follow = true;
    themeClass.update();
    expect([main, popout].map((body) => body.classes.has(FOLLOW_THEME_CLASS))).toEqual([true, true]);
  });

  it("stops updating a window once it closes", () => {
    let follow = true;
    const themeClass = new FollowThemeClass(() => follow);
    const popout = new FakeBody();
    themeClass.add(asBody(popout));
    themeClass.remove(asBody(popout));
    follow = false;
    themeClass.update();
    expect(popout.classes.has(FOLLOW_THEME_CLASS)).toBe(true);
  });

  it("takes the class off every window when cleared", () => {
    const themeClass = new FollowThemeClass(() => true);
    const [main, popout] = [new FakeBody(), new FakeBody()];
    themeClass.add(asBody(main));
    themeClass.add(asBody(popout));
    themeClass.clear();
    expect([main, popout].map((body) => body.classes.size)).toEqual([0, 0]);
  });
});
