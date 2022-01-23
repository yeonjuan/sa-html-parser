import { TokenizingErrors } from "../../common/errors";
import { HtmlTokenType } from "../../tokens";
import { testHtmlTokenizer as t } from "./test-utils";

const { Comment, EOF } = HtmlTokenType;
const { EofInComment } = TokenizingErrors;

describe("tokenizer: comment tokens", () => {
  t("Comment", ["<!-- comment -->", [Comment, EOF]]);
  t("Comment EOF", [
    "<!-- comment",
    [Comment],
    [
      {
        error: EofInComment,
        line: 1,
        column: 12,
        index: 12,
      },
    ],
  ]);
});
