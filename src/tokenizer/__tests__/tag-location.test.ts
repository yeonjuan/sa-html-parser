import { TokenType } from "../../token";
import { testTokensLocations as t } from "./test-utils";

describe("tokenizer - tag locations", () => {
  t("basic", [
    "<div></div>",
    [
      [
        TokenType.Punctuator,
        "<",
        [0, 1],
        {
          line: 1,
          column: 0,
        },
        {
          line: 1,
          column: 1,
        },
      ],
      [
        TokenType.TagName,
        "div",
        [1, 4],
        {
          line: 1,
          column: 1,
        },
        {
          line: 1,
          column: 4,
        },
      ],
      [
        TokenType.Punctuator,
        ">",
        [4, 5],
        {
          line: 1,
          column: 4,
        },
        {
          line: 1,
          column: 5,
        },
      ],
      [
        TokenType.Punctuator,
        "</",
        [5, 7],
        {
          line: 1,
          column: 5,
        },
        {
          line: 1,
          column: 7,
        },
      ],
      [
        TokenType.TagName,
        "div",
        [7, 10],
        {
          line: 1,
          column: 7,
        },
        {
          line: 1,
          column: 10,
        },
      ],
      [
        TokenType.Punctuator,
        ">",
        [10, 11],
        {
          line: 1,
          column: 10,
        },
        {
          line: 1,
          column: 11,
        },
      ],
    ],
  ]);

  t("content", [
    "<div> content </div>",
    [
      [
        TokenType.Punctuator,
        "<",
        [0, 1],
        {
          line: 1,
          column: 0,
        },
        {
          line: 1,
          column: 1,
        },
      ],
      [
        TokenType.TagName,
        "div",
        [1, 4],
        {
          line: 1,
          column: 1,
        },
        {
          line: 1,
          column: 4,
        },
      ],
      [
        TokenType.Punctuator,
        ">",
        [4, 5],
        {
          line: 1,
          column: 4,
        },
        {
          line: 1,
          column: 5,
        },
      ],
      [
        TokenType.WhiteSpaces,
        " ",
        [5, 6],
        {
          line: 1,
          column: 5,
        },
        {
          line: 1,
          column: 6,
        },
      ],
      [
        TokenType.Characters,
        "content",
        [6, 13],
        {
          line: 1,
          column: 6,
        },
        {
          line: 1,
          column: 13,
        },
      ],
      [
        TokenType.WhiteSpaces,
        " ",
        [13, 14],
        {
          line: 1,
          column: 13,
        },
        {
          line: 1,
          column: 14,
        },
      ],
      [
        TokenType.Punctuator,
        "</",
        [14, 16],
        {
          line: 1,
          column: 14,
        },
        {
          line: 1,
          column: 16,
        },
      ],
      [
        TokenType.TagName,
        "div",
        [16, 19],
        {
          line: 1,
          column: 16,
        },
        {
          line: 1,
          column: 19,
        },
      ],
      [
        TokenType.Punctuator,
        ">",
        [19, 20],
        {
          line: 1,
          column: 19,
        },
        {
          line: 1,
          column: 20,
        },
      ],
    ],
  ]);
});
