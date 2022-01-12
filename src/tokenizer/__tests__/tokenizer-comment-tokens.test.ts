import { HtmlTokenType } from "../../tokens";
import { testHtmlTokenizer as t } from "./test-utils";

const { Comment } = HtmlTokenType;

describe("tokenizer: comment tokens", () => {
  t("basic", ["<!-- comment -->", [Comment]]);
});