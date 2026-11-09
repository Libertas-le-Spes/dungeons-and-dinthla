import type { PageId } from "../interface/campaign-pages";

export interface NewsItem {
  sentence: string;
  page: PageId;
}

export interface News {
  latest(): NewsItem | null;
  seen(): Promise<void>;
}
