const MARKDOWN_ENDING = /\.md$/;

export function noteNameOf(path: string): string {
  const fileName = path.substring(path.lastIndexOf("/") + 1);
  return fileName.replace(MARKDOWN_ENDING, "");
}
