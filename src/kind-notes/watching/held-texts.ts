export class HeldTexts {
  private readonly texts = new Map<string, string>();

  hold(path: string, text: string): void {
    this.texts.set(path, text);
  }

  holds(path: string, text: string): boolean {
    return this.texts.get(path) === text;
  }

  takeIfHeld(path: string, text: string): boolean {
    const held = this.holds(path, text);
    this.texts.delete(path);
    return held;
  }

  forget(path: string): void {
    this.texts.delete(path);
  }
}
