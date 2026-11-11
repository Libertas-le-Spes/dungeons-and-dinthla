export interface ImportForm {
  form: string;
  written: (specifier: string) => string;
}

export const IMPORT_FORMS: ImportForm[] = [
  { form: "a plain import", written: (specifier) => `import { a } from "${specifier}";` },
  { form: "a type import", written: (specifier) => `import type { A } from "${specifier}";` },
  { form: "a side-effect import", written: (specifier) => `import "${specifier}";` },
  { form: "a dynamic import", written: (specifier) => `const a = () => import("${specifier}");` },
  { form: "an export from", written: (specifier) => `export { a } from "${specifier}";` },
  { form: "an export star", written: (specifier) => `export * from "${specifier}";` },
  { form: "a single-quoted import", written: (specifier) => `import { a } from '${specifier}';` },
  { form: "a single-quoted import with the import, the from and the path on separate lines", written: (specifier) => `import { a }\nfrom\n'${specifier}';` },
  { form: "a side-effect import in single quotes", written: (specifier) => `import '${specifier}';` },
  { form: "a dynamic import in single quotes", written: (specifier) => `const a = () => import('${specifier}');` },
  { form: "an import in backticks", written: (specifier) => `import { a } from \`${specifier}\`;` },
  { form: "a dynamic import in backticks", written: (specifier) => `const a = () => import(\`${specifier}\`);` },
  { form: "a dynamic import with a comment inside", written: (specifier) => `const a = () => import(/* c */ "${specifier}");` },
  { form: "a require call", written: (specifier) => `const a = require("${specifier}");` },
  { form: "an import equals require", written: (specifier) => `import a = require("${specifier}");` },
  { form: "an import type in a type", written: (specifier) => `export type A = import("${specifier}").A;` },
  { form: "a reference path directive", written: (specifier) => `/// <reference path="${specifier}" />` },
  { form: "a reference types directive", written: (specifier) => `/// <reference types="${specifier}" />` },
];
