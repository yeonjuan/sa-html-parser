import { HtmlTokenType } from "../../tokens";
import { testHtmlTokenizer as t } from "./test-utils";

const { StartTag } = HtmlTokenType;

describe("tokenizer - attr", () => {
  t("attr - unquoted", ["<div name=123>", [StartTag]]);
  t("attr - double quoted", [`<div name="foo">`, [StartTag]]);
  t("attr - single quoted", [`<div name='foo'>`, [StartTag]]);
});
