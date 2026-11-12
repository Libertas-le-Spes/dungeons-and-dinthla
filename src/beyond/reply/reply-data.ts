import type { JsonReader } from "./json/json-reader";
import { beyondSaidNo } from "./reply-refusals";

export function replyDataOf(root: JsonReader): JsonReader {
  if (!root.hasKey("success")) return root;
  if (!root.isTrueAt("success")) throw beyondSaidNo();
  return root.readerAt("data");
}
