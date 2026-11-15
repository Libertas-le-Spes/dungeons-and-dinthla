const FROM_BEYOND = "(from D&D Beyond)";

export class PluginSection {
  readonly heading: string;
  readonly formerHeading: string;

  constructor(readonly title: string) {
    this.heading = `## ${title}`;
    this.formerHeading = `## ${title} ${FROM_BEYOND}`;
  }

  isHeadedBy(line: string): boolean {
    return [this.heading, this.formerHeading].includes(line);
  }
}
