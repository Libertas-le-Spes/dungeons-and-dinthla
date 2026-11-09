import type { PageId } from "../interface/campaign-pages";

export type NewsPage = Exclude<PageId, "note">;

export interface NewsItem {
  sentence: string;
  page: NewsPage;
}

export interface News {
  latest(): NewsItem | null;
  seen(): Promise<void>;
}
