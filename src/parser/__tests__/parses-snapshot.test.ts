import { Parser } from "../parser";

describe("parses: snapshot", () => {
  let parser: Parser;

  beforeEach(() => {
    parser = new Parser();
  });

  test("basic", () => {
    const result = parser.parse(
      `<span class="_1syGnXOL _3di88A4c" data-clk="dropbanner1b" style="padding-right: 20px; color: white; padding-left: 20px"><span>웨일 사용자 목소리입니다.</span></span>`
    );
    expect(result).toMatchSnapshot();
  });
});
