import { HtmlTokenType } from "../../token-html";
import { testHtmlTokenizer as t } from "./test-utils";

const { Comment } = HtmlTokenType;

describe("tokenizer - comment", () => {
  t("basic", ["<!-- comment -->", [Comment]]);
});
