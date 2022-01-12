import { Parser } from "../parser";

describe("parser: comment", () => {
  let parser: Parser;

  beforeEach(() => {
    parser = new Parser();
  });

  describe("basic", () => {
    test("one line", () => {
      const result = parser.parse("<!-- comment -->");

      expect(result.comments.length).toBe(1);

      const [comment] = result.comments;

      expect(comment.type).toBe("Block");
      expect(comment.value).toBe(" comment ");
      expect(comment.start).toBe(0);
      expect(comment.end).toBe(16);
      expect(comment.range).toStrictEqual([0, 16]);
      expect(comment.loc.start.column).toBe(0);
      expect(comment.loc.start.line).toBe(1);
      expect(comment.loc.end.column).toBe(16);
      expect(comment.loc.end.line).toBe(1);
    });

    test("multiple lines", () => {
      const result = parser.parse("<!--\n comment\n -->");

      expect(result.comments.length).toBe(1);

      const [comment] = result.comments;

      expect(comment.type).toBe("Block");
      expect(comment.value).toBe("\n comment\n ");
      expect(comment.start).toBe(0);
      expect(comment.end).toBe(18);
      expect(comment.range).toStrictEqual([0, 18]);
      expect(comment.loc.start.column).toBe(0);
      expect(comment.loc.start.line).toBe(1);
      expect(comment.loc.end.column).toBe(4);
      expect(comment.loc.end.line).toBe(3);
    });

    test("multiple comments", () => {
      const result = parser.parse("<!-- comment1 --><!-- comment2 -->");

      expect(result.comments.length).toBe(2);

      const [first, second] = result.comments;

      expect(first.type).toBe("Block");
      expect(first.value).toBe(" comment1 ");
      expect(first.start).toBe(0);
      expect(first.end).toBe(17);
      expect(first.range).toStrictEqual([0, 17]);
      expect(first.loc.start.column).toBe(0);
      expect(first.loc.start.line).toBe(1);
      expect(first.loc.end.column).toBe(17);
      expect(first.loc.end.line).toBe(1);

      expect(second.type).toBe("Block");
      expect(second.value).toBe(" comment2 ");
      expect(second.start).toBe(17);
      expect(second.end).toBe(34);
      expect(second.range).toStrictEqual([17, 34]);
      expect(second.loc.start.column).toBe(17);
      expect(second.loc.start.line).toBe(1);
      expect(second.loc.end.column).toBe(34);
      expect(second.loc.end.line).toBe(1);
    });
  });
});
