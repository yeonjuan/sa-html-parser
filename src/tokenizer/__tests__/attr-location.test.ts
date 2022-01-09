import { AtomTokenType } from "../../tokens";
import { testTokensLocations as t } from "./test-utils";

describe("tokenizer - attr locations", () => {
  t("basic", [
    `<div name="value">`,
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
        AtomTokenType.AttrName,
        "name",
        [5, 9],
        {
          line: 1,
          column: 5,
        },
        {
          line: 1,
          column: 9,
        },
      ],
      [
        AtomTokenType.Punctuator,
        "=",
        [9, 10],
        {
          line: 1,
          column: 9,
        },
        {
          line: 1,
          column: 10,
        },
      ],
      [
        AtomTokenType.AttrValue,
        `"value"`,
        [10, 17],
        {
          line: 1,
          column: 10,
        },
        {
          line: 1,
          column: 17,
        },
      ],
      [
        AtomTokenType.Punctuator,
        ">",
        [17, 18],
        {
          line: 1,
          column: 17,
        },
        {
          line: 1,
          column: 18,
        },
      ],
    ],
  ]);
});
