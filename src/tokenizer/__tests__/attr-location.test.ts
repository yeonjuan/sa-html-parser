import { TokenType } from "../../token";
import { testTokensLocations as t } from "./test-utils";

describe("tokenizer - attr locations", () => {
  t("basic", [
    `<div name="value">`,
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
        TokenType.AttrName,
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
        TokenType.Punctuator,
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
        TokenType.AttrValue,
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
        TokenType.Punctuator,
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
