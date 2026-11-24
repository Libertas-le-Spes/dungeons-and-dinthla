import type { WriteReport } from "./write-report";

export interface HeardWrites {
  listen(listener: WriteReport): () => void;
}
