import { AtomTokenType } from "../../tokens";
import { testTokensLocations as t } from "./test-utils";

describe("tokenizer: tag locations", () => {
  t("basic", [
    "<div></div>",
    [
      [
        AtomTokenType.Punctuator,
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
        AtomTokenType.TagName,
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
        AtomTokenType.Punctuator,
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
        AtomTokenType.Punctuator,
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
        AtomTokenType.TagName,
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
        AtomTokenType.Punctuator,
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
        AtomTokenType.Punctuator,
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
        AtomTokenType.TagName,
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
        AtomTokenType.Punctuator,
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
        AtomTokenType.WhiteSpaces,
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
        AtomTokenType.Characters,
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
        AtomTokenType.WhiteSpaces,
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
        AtomTokenType.Punctuator,
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
        AtomTokenType.TagName,
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
        AtomTokenType.Punctuator,
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

  t("self closing", [
    "<div />",
    [
      [
        AtomTokenType.Punctuator,
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
        AtomTokenType.TagName,
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
        AtomTokenType.Punctuator,
        "/>",
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
    ],
  ]);
});
