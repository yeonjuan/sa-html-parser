import { Parser } from "../parser";

describe("parse - comment", () => {
  let parser: Parser;

  beforeEach(() => {
    parser = new Parser();
  });

  describe("basic", () => {
    test("one line", () => {
      const result = parser.parse("<!-- comment -->");
      expect(result.comments.length).toBe(1);

      expect(result.comments[0].type).toBe("Block");
      expect(result.comments[0].value).toBe(" comment ");

      expect(result.comments[0].start).toBe(0);
      expect(result.comments[0].end).toBe(16);

      expect(result.comments[0].range[0]).toBe(0);
      expect(result.comments[0].range[1]).toBe(16);

      expect(result.comments[0].loc.start.column).toBe(0);
      expect(result.comments[0].loc.start.line).toBe(1);

      expect(result.comments[0].loc.end.column).toBe(16);
      expect(result.comments[0].loc.end.line).toBe(1);
    });

    test("multiple lines", () => {
      const result = parser.parse("<!--\n comment\n -->");
      expect(result.comments.length).toBe(1);

      expect(result.comments[0].type).toBe("Block");
      expect(result.comments[0].value).toBe("\n comment\n ");

      expect(result.comments[0].start).toBe(0);
      expect(result.comments[0].end).toBe(18);

      expect(result.comments[0].range[0]).toBe(0);
      expect(result.comments[0].range[1]).toBe(18);

      expect(result.comments[0].loc.start.column).toBe(0);
      expect(result.comments[0].loc.start.line).toBe(1);

      expect(result.comments[0].loc.end.column).toBe(4);
      expect(result.comments[0].loc.end.line).toBe(3);
    });

    test("multiple comments", () => {
      const result = parser.parse("<!-- comment1 --><!-- comment2 -->");
      expect(result.comments.length).toBe(2);
      expect(result.comments[0].start).toBe(0);
      expect(result.comments[1].end).toBe(34);
    });
  });
});
