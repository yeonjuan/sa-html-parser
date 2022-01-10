import { HtmlTokenType } from "../../tokens";
import { testHtmlTokenizer as t } from "./test-utils";

const { StartTag, EndTag } = HtmlTokenType;

describe("tag - tokens", () => {
  t("start only", ["<div>", [StartTag]]);
  t("basic", ["<div></div>", [StartTag, EndTag]]);
  t("self closing", ["<div/>", [StartTag]]);
  t("self closing with attrs", ["<div name='value' />", [StartTag]]);
});
