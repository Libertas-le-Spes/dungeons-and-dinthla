export class SavesHere {
  private readonly texts = new Map<string, Set<string>>();

  saved(path: string, text: string): void {
    const kept = this.texts.get(path);
    if (kept === undefined) {
      this.texts.set(path, new Set([text]));
      return;
    }
    kept.add(text);
  }

  forget(path: string): void {
    this.texts.delete(path);
  }

  takeIfSavedHere(path: string, text: string): boolean {
    const kept = this.texts.get(path);
    if (kept === undefined) return false;
    const wasSaved = kept.delete(text);
    if (kept.size === 0) this.texts.delete(path);
    return wasSaved;
  }
}
