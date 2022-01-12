import { Parser } from "../parser";

describe("parse - comment", () => {
  let parser: Parser;

  beforeEach(() => {
    parser = new Parser();
  });

  test("basic", () => {
    const result = parser.parse("<!DOCTYPE html>");
    expect(result.children.length).toBe(1);

    const [doctype] = result.children;
    expect(doctype.type).toBe("#DocumentType");
    expect(doctype.start).toBe(0);
    expect(doctype.end).toBe(15);

    expect(doctype.loc.start.column).toBe(0);
    expect(doctype.loc.start.line).toBe(1);

    expect(doctype.loc.end.column).toBe(15);
    expect(doctype.loc.end.line).toBe(1);
  });
});
