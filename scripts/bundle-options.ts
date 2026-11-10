import type { BuildOptions } from "esbuild";

export const PLUGIN_BUNDLE: BuildOptions = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron", "@codemirror/state", "@codemirror/view"],
  format: "cjs",
  target: "es2022",
  outfile: "main.js",
  logLevel: "info",
};

export const STYLES_BUNDLE: BuildOptions = {
  entryPoints: ["styles/index.css"],
  bundle: true,
  loader: { ".woff2": "dataurl" },
  outfile: "styles.css",
  logLevel: "info",
};
