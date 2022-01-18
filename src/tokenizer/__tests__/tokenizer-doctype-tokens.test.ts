import { TokenizingErrors } from "../../common/errors";
import { HtmlTokenType } from "../../tokens";
import { testHtmlTokenizer as t } from "./test-utils";

const { Doctype, Comment } = HtmlTokenType;
const { EofInDoctype, MissingDoctypeName, MissingWhitespaceBeforeDoctypeName } =
  TokenizingErrors;

describe("tokenizer: doctype tokens", () => {
  t("Doctype lower case", ["<!DOCTYPE html>", [Doctype]]);
  t("Doctype upper case", ["<!DOCTYPE HTML>", [Doctype]]);
  t("Doctype mixed case", ["<!DOCTYPE HTML>", [Doctype]]);
  t("Doctype EOF 1", [
    "<!DOCTYPE HTML",
    [Doctype],
    [
      {
        error: EofInDoctype,
        line: 1,
        column: 14,
        index: 14,
      },
    ],
  ]);
  t("Doctype EOF 2", ["<!DOC", [Comment]]);
  t("Doctype without name", [
    "<!DOCTYPE>",
    [Doctype],
    [
      {
        error: MissingDoctypeName,
        line: 1,
        column: 9,
        index: 9,
      },
    ],
  ]);
  t("Doctype without a space", [
    "<!DOCTYPEhtml>",
    [Doctype],
    [
      {
        error: MissingWhitespaceBeforeDoctypeName,
        line: 1,
        column: 9,
        index: 9,
      },
    ],
  ]);

  t("Doctype double quoted publicId", [
    `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">`,
    [Doctype],
  ]);
  t("Doctype single quoted publicId", [
    `<!DOCTYPE HTML PUBLIC '-//W3C//DTD HTML 4.01 Transitional//EN' 'http://www.w3.org/TR/html4/loose.dtd'>`,
    [Doctype],
  ]);
  t("Doctype double quoted systemId", [
    `<!DOCTYPE document SYSTEM "subjects.dtd">`,
    [Doctype],
  ]);
  t("Doctype single quoted systemId", [
    `<!DOCTYPE document SYSTEM 'subjects.dtd'>`,
    [Doctype],
  ]);
});
