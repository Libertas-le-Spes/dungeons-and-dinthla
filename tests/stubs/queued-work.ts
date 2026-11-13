export function queuedWorkRan(): Promise<void> {
  return new Promise(function afterQueuedWork(ran): void {
    setTimeout(ran, 0);
  });
}
