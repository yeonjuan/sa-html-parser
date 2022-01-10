import { HtmlTokenType } from "../../tokens";
import { testHtmlTokenizer as t } from "./test-utils";

const { StartTag, EndTag } = HtmlTokenType;

describe("tokenizer - tag", () => {
  t("start only", ["<div>", [StartTag]]);
  t("basic", ["<div></div>", [StartTag, EndTag]]);
  t("self close", ["<div />", [StartTag]]);
});
