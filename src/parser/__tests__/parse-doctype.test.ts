import { Parser } from "../parser";

describe("parse - comment", () => {
  let parser: Parser;

  beforeEach(() => {
    parser = new Parser();
  });

  test("basic", () => {
    const result = parser.parse("<!DOCTYPE html>");
    expect(result.children.length).toBe(1);
    expect(result.children[0].type).toBe("#DocumentType");
    expect(result.children[0].start).toBe(0);
    expect(result.children[0].end).toBe(15);

    expect(result.children[0].loc.start.column).toBe(0);
    expect(result.children[0].loc.start.line).toBe(1);

    expect(result.children[0].loc.end.column).toBe(15);
    expect(result.children[0].loc.end.line).toBe(1);
  });
});
