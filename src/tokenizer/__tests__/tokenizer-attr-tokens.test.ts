import { HtmlTokenType } from "../../tokens";
import { testHtmlTokenizer as t } from "./test-utils";

const { StartTag, EOF } = HtmlTokenType;

describe("tokenizer: attr locations", () => {
  t("attr - unquoted", ["<div name=123>", [StartTag, EOF]]);
  t("attr - double quoted", [`<div name="foo">`, [StartTag, EOF]]);
  t("attr - single quoted", [`<div name='foo'>`, [StartTag, EOF]]);
});
