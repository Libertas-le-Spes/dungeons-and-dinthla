export type LineListener = () => void;

interface WantedLine {
  path: string;
  line: number;
}

export class WantedLines {
  private wanted: WantedLine | null = null;
  private readonly listeners = new Set<LineListener>();

  want(path: string, line: number): void {
    this.wanted = { path, line };
    for (const listener of this.listeners) listener();
  }

  takeFor(path: string): number | null {
    const wanted = this.wanted;
    if (wanted === null || wanted.path !== path) return null;
    this.wanted = null;
    return wanted.line;
  }

  subscribe(listener: LineListener): () => void {
    this.listeners.add(listener);
    return this.forget.bind(this, listener);
  }

  private forget(listener: LineListener): void {
    this.listeners.delete(listener);
  }
}
