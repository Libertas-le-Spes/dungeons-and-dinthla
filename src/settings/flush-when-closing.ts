export interface Flushable {
  flush(): void;
}

export interface Closing {
  onUnload(run: () => void): void;
  onQuit(run: () => void): void;
  onVisibilityChange(run: () => void): void;
  onPageHide(run: () => void): void;
  pageHidden(): boolean;
}

function flushIfHidden(local: Flushable, closing: Closing): void {
  if (closing.pageHidden()) local.flush();
}

export function flushWhenClosing(local: Flushable, closing: Closing): void {
  closing.onUnload(() => local.flush());
  closing.onQuit(() => local.flush());
  closing.onVisibilityChange(() => flushIfHidden(local, closing));
  closing.onPageHide(() => local.flush());
}
