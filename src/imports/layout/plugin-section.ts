const FROM_BEYOND = "(from D&D Beyond)";

export class PluginSection {
  readonly heading: string;

  constructor(readonly title: string) {
    this.heading = `## ${title} ${FROM_BEYOND}`;
  }
}
