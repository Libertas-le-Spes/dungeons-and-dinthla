import { CatalogKeysRule } from "./catalog-keys-rule";
import type { DocumentRule } from "./document-rule";
import { NamesTreeRule } from "./names-tree-rule";

export const DOCUMENT_RULES: readonly DocumentRule[] = [new CatalogKeysRule(), new NamesTreeRule()];
