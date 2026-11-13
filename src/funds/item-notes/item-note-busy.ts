export class ItemNoteBusy {
  private readonly writing = new Set<string>();
  private readonly failed = new Map<string, string>();

  isWriting(path: string): boolean {
    return this.writing.has(path);
  }

  startWriting(path: string): void {
    this.writing.add(path);
    this.failed.delete(path);
  }

  stopWriting(path: string): void {
    this.writing.delete(path);
  }

  hasFailed(path: string, key: string): boolean {
    return this.failed.get(path) === key;
  }

  fail(path: string, key: string): void {
    this.failed.set(path, key);
  }
}
