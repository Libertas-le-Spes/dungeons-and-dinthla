const FENCE = /^ {0,3}(`{3,}|~{3,})/;

export class FenceTracker {
  private opening: string | null = null;

  allowsHeading(line: string): boolean {
    const marker = this.markerIn(line);
    if (this.opening === null) return this.opensOrAllows(marker);
    this.closesWith(this.opening, marker);
    return false;
  }

  private markerIn(line: string): string | null {
    const match = FENCE.exec(line);
    if (match === null) return null;
    const marker = match[1];
    if (marker === undefined) return null;
    return marker;
  }

  private opensOrAllows(marker: string | null): boolean {
    if (marker === null) return true;
    this.opening = marker;
    return false;
  }

  private closesWith(opening: string, marker: string | null): void {
    if (marker === null) return;
    if (marker.charAt(0) !== opening.charAt(0)) return;
    if (marker.length < opening.length) return;
    this.opening = null;
  }
}
