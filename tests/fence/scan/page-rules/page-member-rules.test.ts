import { describe, expect, it, vi } from "vitest";
import { SyntaxKind, type Node } from "typescript/unstable/ast";
import type { FileScan } from "../reading/file-scan";
import { boundUses } from "./page-member-rules";

function boundIn(kind: SyntaxKind): Node {
  const pattern = { kind: SyntaxKind.ObjectBindingPattern };
  const binding = { kind, parent: pattern };
  return { kind: SyntaxKind.Identifier, parent: binding } as unknown as Node;
}

function scanWith(node: Node, getPropertyOfType: () => undefined) {
  return {
    found: { destructured: [{ node, name: "title" }] },
    project: { checker: { getTypeAtLocation: () => undefined, getPropertyOfType } },
  } as unknown as FileScan;
}

describe("a destructured name whose type the checker can't give", () => {
  it("counts as a page member, failing closed, without asking for the name's property", () => {
    const getPropertyOfType = vi.fn(() => undefined);
    const bound = boundIn(SyntaxKind.BindingElement);
    expect(boundUses(scanWith(bound, getPropertyOfType))).toEqual([{ node: bound, name: "title" }]);
    expect(getPropertyOfType).not.toHaveBeenCalled();
  });

  it("is passed over when the name isn't destructured from an object", () => {
    const getPropertyOfType = vi.fn(() => undefined);
    expect(boundUses(scanWith(boundIn(SyntaxKind.Parameter), getPropertyOfType))).toEqual([]);
  });
});
