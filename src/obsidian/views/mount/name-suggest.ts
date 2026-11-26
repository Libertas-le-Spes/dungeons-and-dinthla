import { AbstractInputSuggest, type App } from "obsidian";

export class NameSuggest extends AbstractInputSuggest<string> {
  constructor(
    app: App,
    private readonly input: HTMLInputElement,
    private readonly names: readonly string[],
  ) {
    super(app, input);
  }

  protected getSuggestions(query: string): string[] {
    const typed = query.toLowerCase();
    return this.names.filter((name) => name.toLowerCase().includes(typed));
  }

  renderSuggestion(name: string, element: HTMLElement): void {
    element.setText(name);
  }

  override selectSuggestion(name: string): void {
    this.setValue(name);
    this.input.dispatchEvent(new Event("input"));
    this.close();
  }
}
