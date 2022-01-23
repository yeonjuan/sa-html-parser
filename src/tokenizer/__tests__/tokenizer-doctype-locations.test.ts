import { AtomTokenType } from "../../tokens";
import { testTokensLocations as t } from "./test-utils";

describe("tokenizer: doctype locations", () => {
  t("basic", [
    "<!DOCTYPE html>",
    [
      [
        AtomTokenType.Punctuator,
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
        AtomTokenType.Characters,
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
        AtomTokenType.Punctuator,
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
        AtomTokenType.Punctuator,
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
        AtomTokenType.Characters,
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
        AtomTokenType.Characters,
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
        AtomTokenType.Characters,
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
        AtomTokenType.Characters,
        "http://www.w3.org/TR/html4/loose.dtd",
        [63, 100],
        {
          line: 1,
          column: 63,
        },
        {
          line: 1,
          column: 100,
        },
      ],
      [
        AtomTokenType.Punctuator,
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
        AtomTokenType.Punctuator,
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
        AtomTokenType.Characters,
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
        AtomTokenType.Characters,
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
        AtomTokenType.Characters,
        "subjects.dtd",
        [26, 39],
        {
          line: 1,
          column: 26,
        },
        {
          line: 1,
          column: 39,
        },
      ],
      [
        AtomTokenType.Punctuator,
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
