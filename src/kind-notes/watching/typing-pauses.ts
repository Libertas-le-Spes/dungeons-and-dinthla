export type PauseListener = (path: string, text: string) => void;

export class TypingPauses {
  private readonly listeners = new Set<PauseListener>();

  paused(path: string, text: string): void {
    for (const listener of this.listeners) listener(path, text);
  }

  onPause(listener: PauseListener): () => void {
    const listeners = this.listeners;
    listeners.add(listener);
    function stop(): void {
      listeners.delete(listener);
    }
    return stop;
  }
}
