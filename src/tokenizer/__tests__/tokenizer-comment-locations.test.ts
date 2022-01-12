import { AtomTokenType } from "../../tokens";
import { testTokensLocations as t } from "./test-utils";

describe("tokenizer:comment locations", () => {
  t("basic", [
    "<!-- comment -->",
    [
      [
        AtomTokenType.Punctuator,
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
        AtomTokenType.Characters,
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
        AtomTokenType.Punctuator,
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
        AtomTokenType.Punctuator,
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
        AtomTokenType.Characters,
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
        AtomTokenType.Punctuator,
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
        AtomTokenType.Punctuator,
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
        AtomTokenType.Characters,
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
        AtomTokenType.Punctuator,
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
        AtomTokenType.Punctuator,
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
        AtomTokenType.Characters,
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
        AtomTokenType.Punctuator,
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
