export const FOLLOW_THEME_CLASS = "dd-follow-theme";

export class ThemeClass {
  private readonly bodies = new Set<HTMLElement>();

  constructor(private readonly followsTheme: () => boolean) {}

  add(body: HTMLElement): void {
    this.bodies.add(body);
    this.update();
  }

  remove(body: HTMLElement): void {
    this.bodies.delete(body);
  }

  update(): void {
    const follow = this.followsTheme();
    for (const body of this.bodies) body.toggleClass(FOLLOW_THEME_CLASS, follow);
  }

  clear(): void {
    for (const body of this.bodies) body.removeClass(FOLLOW_THEME_CLASS);
  }
}
