export class EditorLeaves {
  private readonly paths = new WeakMap<object, string>();

  keep(leaf: object, path: string): void {
    this.paths.set(leaf, path);
  }

  keeps(leaf: object, path: string): boolean {
    return this.paths.get(leaf) === path;
  }
}
