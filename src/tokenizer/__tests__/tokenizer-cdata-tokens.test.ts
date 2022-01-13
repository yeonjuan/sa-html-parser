import { HtmlTokenType } from "../../tokens";
import { testHtmlTokenizer as t } from "./test-utils";

const { StartTag, CharacterLike, Comment, EndTag, EOF } = HtmlTokenType;

describe("tokenizer: cdata tokens", () => {
  t("basic", [
    `<script>
//<![CDATA[
  content
//]]>
</script>`,
    [
      StartTag,
      CharacterLike,
      CharacterLike,
      Comment,
      CharacterLike,
      EndTag,
      EOF,
    ],
  ]);
});
