import { ParsingError, ParsingErrors } from "../../common/errors";
import { parse } from "../parser";

describe("parser: error", () => {
  test("missing start tag", () => {
    const { errors } = parse("<div></span></div>");
    expect(errors[0]).toStrictEqual(
      new ParsingError(
        { column: 5, line: 1 },
        5,
        ParsingErrors.MissingStartElement
      )
    );
  });
});
