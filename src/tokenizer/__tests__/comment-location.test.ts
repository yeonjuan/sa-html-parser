import { TokenType } from "../../token";
import { testTokensLocations as t } from "./test-utils";

describe("tokenizer - comment locations", () => {
  t("basic", [
    "<!-- comment -->",
    [
      [
        TokenType.Punctuator,
        "<!--",
        [0, 4],
        {
          line: 1,
          column: 0,
        },
        {
          line: 1,
          column: 4,
        },
      ],
      [
        TokenType.Characters,
        " comment ",
        [4, 13],
        {
          line: 1,
          column: 4,
        },
        {
          line: 1,
          column: 13,
        },
      ],
      [
        TokenType.Punctuator,
        "-->",
        [13, 16],
        {
          line: 1,
          column: 13,
        },
        {
          line: 1,
          column: 16,
        },
      ],
    ],
  ]);

  t("space", [
    "<!-- -->",
    [
      [
        TokenType.Punctuator,
        "<!--",
        [0, 4],
        {
          line: 1,
          column: 0,
        },
        {
          line: 1,
          column: 4,
        },
      ],
      [
        TokenType.Characters,
        " ",
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
        "-->",
        [5, 8],
        {
          line: 1,
          column: 5,
        },
        {
          line: 1,
          column: 8,
        },
      ],
    ],
  ]);

  t("newline", [
    `<!--
-->`,
    [
      [
        TokenType.Punctuator,
        "<!--",
        [0, 4],
        {
          line: 1,
          column: 0,
        },
        {
          line: 1,
          column: 4,
        },
      ],
      [
        TokenType.Characters,
        "\n",
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
        "-->",
        [5, 8],
        {
          line: 2,
          column: 0,
        },
        {
          line: 2,
          column: 3,
        },
      ],
    ],
  ]);

  t("newline - window", [
    "<!--\r\n-->",
    [
      [
        TokenType.Punctuator,
        "<!--",
        [0, 4],
        {
          line: 1,
          column: 0,
        },
        {
          line: 1,
          column: 4,
        },
      ],
      [
        TokenType.Characters,
        "\r\n",
        [4, 6],
        {
          line: 1,
          column: 4,
        },
        {
          line: 1,
          column: 6,
        },
      ],
      [
        TokenType.Punctuator,
        "-->",
        [6, 9],
        {
          line: 2,
          column: 0,
        },
        {
          line: 2,
          column: 3,
        },
      ],
    ],
  ]);
});
