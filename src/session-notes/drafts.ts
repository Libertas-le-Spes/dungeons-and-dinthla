export class Drafts {
  private readonly texts = new Map<string, string>();

  textOf(path: string): string {
    const text = this.texts.get(path);
    if (text === undefined) return "";
    return text;
  }

  keep(path: string, text: string): void {
    if (text === "") this.texts.delete(path);
    else this.texts.set(path, text);
  }

  moved(oldPath: string, path: string): void {
    const text = this.texts.get(oldPath);
    if (text === undefined) return;
    this.texts.delete(oldPath);
    this.texts.set(path, text);
  }
}
