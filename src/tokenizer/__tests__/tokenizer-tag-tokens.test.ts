import { HtmlTokenType } from "../../tokens";
import { TokenizingErrors } from "../../common/errors";
import { testHtmlTokenizer as t } from "./test-utils";
const { InvalidFirstCharacterOfTagName } = TokenizingErrors;
const { StartTag, EndTag, CharacterLike, EOF } = HtmlTokenType;

describe("tokenizer: tag tokens", () => {
  t("Start only", ["<div>", [StartTag, EOF]]);
  t("Basic", ["<div></div>", [StartTag, EndTag, EOF]]);
  t("Self closing", ["<div/>", [StartTag, EOF]]);
  t("Self closing with attributes", ["<div name='value' />", [StartTag, EOF]]);
  t("Invalid first character of tag name 1.", [
    "<div>1<2</div>",
    [StartTag, CharacterLike, EndTag, EOF],
    [
      {
        error: InvalidFirstCharacterOfTagName,
        line: 1,
        column: 7,
        index: 7,
      },
    ],
  ]);
  t("Invalid first character of tag name 2.", [
    "<div>1<<2</div>",
    [StartTag, CharacterLike, EndTag, EOF],
    [
      {
        error: InvalidFirstCharacterOfTagName,
        line: 1,
        column: 7,
        index: 7,
      },
      {
        error: InvalidFirstCharacterOfTagName,
        line: 1,
        column: 8,
        index: 8,
      },
    ],
  ]);
});
