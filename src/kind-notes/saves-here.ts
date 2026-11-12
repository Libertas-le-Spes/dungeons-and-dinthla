export class SavesHere {
  private readonly texts = new Map<string, string>();

  saved(path: string, text: string): void {
    this.texts.set(path, text);
  }

  forget(path: string): void {
    this.texts.delete(path);
  }

  takeIfSavedHere(path: string, text: string): boolean {
    const saved = this.texts.get(path);
    this.texts.delete(path);
    return saved === text;
  }
}
