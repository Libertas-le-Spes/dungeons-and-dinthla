export interface Flushable {
  flush(): void;
}

export interface Closing {
  onUnload(run: () => void): void;
  onQuit(run: () => void): void;
}

export function flushWhenClosing(local: Flushable, closing: Closing): void {
  closing.onUnload(() => local.flush());
  closing.onQuit(() => local.flush());
}
