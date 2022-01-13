import { AtomTokenType } from "../../tokens";
import { testTokensLocations as t } from "./test-utils";

const { Punctuator, TagName, Characters, WhiteSpaces } = AtomTokenType;

describe("tokenizer: cdata locations", () => {
  t("basic", [
    `<script>
//<![CDATA[
  content
//]]>
</script>`,
    [
      [
        Punctuator,
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
        TagName,
        "script",
        [1, 7],
        {
          line: 1,
          column: 1,
        },
        {
          line: 1,
          column: 7,
        },
      ],
      [
        Punctuator,
        ">",
        [7, 8],
        {
          line: 1,
          column: 7,
        },
        {
          line: 1,
          column: 8,
        },
      ],
      [
        WhiteSpaces,
        "\n",
        [8, 9],
        {
          line: 1,
          column: 8,
        },
        {
          line: 1,
          column: 9,
        },
      ],
      [
        Characters,
        "//",
        [9, 11],
        {
          line: 2,
          column: 0,
        },
        {
          line: 2,
          column: 2,
        },
      ],
      [
        Punctuator,
        "<!",
        [11, 13],
        {
          line: 2,
          column: 2,
        },
        {
          line: 2,
          column: 4,
        },
      ],
      [
        Characters,
        "[CDATA[\n  content\n//]]",
        [13, 35],
        {
          line: 2,
          column: 4,
        },
        {
          line: 4,
          column: 4,
        },
      ],
      [
        Punctuator,
        ">",
        [35, 36],
        {
          line: 4,
          column: 4,
        },
        {
          line: 4,
          column: 5,
        },
      ],
      [
        WhiteSpaces,
        "\n",
        [36, 37],
        {
          line: 4,
          column: 5,
        },
        {
          line: 4,
          column: 6,
        },
      ],
      [
        Punctuator,
        "</",
        [37, 39],
        {
          line: 5,
          column: 0,
        },
        {
          line: 5,
          column: 2,
        },
      ],
      [
        TagName,
        "script",
        [39, 45],
        {
          line: 5,
          column: 2,
        },
        {
          line: 5,
          column: 8,
        },
      ],
      [
        Punctuator,
        ">",
        [45, 46],
        {
          line: 5,
          column: 8,
        },
        {
          line: 5,
          column: 9,
        },
      ],
    ],
  ]);
});
