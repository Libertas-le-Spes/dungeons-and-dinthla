import { HeldTexts } from "./held-texts";

export class SavesHere {
  private readonly texts = new Map<string, Set<string>>();
  private readonly editorTexts = new HeldTexts();

  saved(path: string, text: string): void {
    const kept = this.texts.get(path);
    if (kept === undefined) {
      this.texts.set(path, new Set([text]));
      return;
    }
    kept.add(text);
  }

  savedInEditor(path: string, text: string): void {
    this.editorTexts.hold(path, text);
  }

  forget(path: string): void {
    this.texts.delete(path);
    this.editorTexts.forget(path);
  }

  takeIfSavedHere(path: string, text: string): boolean {
    const savedByThePlugin = this.takeSaved(path, text);
    const savedInEditor = this.editorTexts.takeIfHeld(path, text);
    if (savedInEditor) return true;
    return savedByThePlugin;
  }

  private takeSaved(path: string, text: string): boolean {
    const kept = this.texts.get(path);
    if (kept === undefined) return false;
    const wasSaved = kept.delete(text);
    if (kept.size === 0) this.texts.delete(path);
    return wasSaved;
  }
}
