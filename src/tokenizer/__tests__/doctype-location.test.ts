import { TokenType } from "../../token";
import { testTokensLocations as t } from "./test-utils";

describe("tokenizer - tag locations", () => {
  t("basic", [
    "<!DOCTYPE html>",
    [
      [
        TokenType.Punctuator,
        "<!DOCTYPE",
        [0, 9],
        {
          line: 1,
          column: 0,
        },
        {
          line: 1,
          column: 9,
        },
      ],
      [
        TokenType.Characters,
        "html",
        [10, 14],
        {
          line: 1,
          column: 10,
        },
        {
          line: 1,
          column: 14,
        },
      ],
      [
        TokenType.Punctuator,
        ">",
        [14, 15],
        {
          line: 1,
          column: 14,
        },
        {
          line: 1,
          column: 15,
        },
      ],
    ],
  ]);

  t("public - double quoted", [
    `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">`,
    [
      [
        TokenType.Punctuator,
        "<!DOCTYPE",
        [0, 9],
        {
          line: 1,
          column: 0,
        },
        {
          line: 1,
          column: 9,
        },
      ],
      [
        TokenType.Characters,
        "html",
        [10, 14],
        {
          line: 1,
          column: 10,
        },
        {
          line: 1,
          column: 14,
        },
      ],
      [
        TokenType.Characters,
        "PUBLIC",
        [15, 21],
        {
          line: 1,
          column: 15,
        },
        {
          line: 1,
          column: 21,
        },
      ],
      [
        TokenType.Characters,
        "-//W3C//DTD HTML 4.01 Transitional//EN",
        [23, 61],
        {
          line: 1,
          column: 23,
        },
        {
          line: 1,
          column: 61,
        },
      ],
      [
        TokenType.Characters,
        "http://www.w3.org/TR/html4/loose.dtd",
        [64, 100],
        {
          line: 1,
          column: 64,
        },
        {
          line: 1,
          column: 100,
        },
      ],
      [
        TokenType.Punctuator,
        ">",
        [101, 102],
        {
          line: 1,
          column: 101,
        },
        {
          line: 1,
          column: 102,
        },
      ],
    ],
  ]);

  t("system", [
    `<!DOCTYPE document SYSTEM "subjects.dtd">`,
    [
      [
        TokenType.Punctuator,
        "<!DOCTYPE",
        [0, 9],
        {
          line: 1,
          column: 0,
        },
        {
          line: 1,
          column: 9,
        },
      ],
      [
        TokenType.Characters,
        "document",
        [10, 18],
        {
          line: 1,
          column: 10,
        },
        {
          line: 1,
          column: 18,
        },
      ],
      [
        TokenType.Characters,
        "SYSTEM",
        [19, 25],
        {
          line: 1,
          column: 19,
        },
        {
          line: 1,
          column: 25,
        },
      ],
      [
        TokenType.Characters,
        "subjects.dtd",
        [27, 39],
        {
          line: 1,
          column: 27,
        },
        {
          line: 1,
          column: 39,
        },
      ],
      [
        TokenType.Punctuator,
        ">",
        [40, 41],
        {
          line: 1,
          column: 40,
        },
        {
          line: 1,
          column: 41,
        },
      ],
    ],
  ]);
});
