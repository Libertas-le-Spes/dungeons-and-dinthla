import type { NewsItem } from "./news-item";

export const NEWS_BY_VERSION: ReadonlyMap<string, NewsItem> = new Map<string, NewsItem>([
  ["0.4.0", { sentence: "You can now bring your character in from D&D Beyond, online or from its PDF.", page: "cast" }],
]);
