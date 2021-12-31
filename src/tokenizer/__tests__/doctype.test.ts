import { HtmlTokenType } from "../../token-html";
import { testHtmlTokenizer as t } from "./test-utils";

const { Doctype } = HtmlTokenType;

describe("tokenizer - doctype", () => {
  t("basic", ["<!DOCTYPE html>", [Doctype]]);
  t("public - double quoted", [
    `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">`,
    [Doctype],
  ]);
  t("public - single quoted", [
    `<!DOCTYPE HTML PUBLIC '-//W3C//DTD HTML 4.01 Transitional//EN' 'http://www.w3.org/TR/html4/loose.dtd'>`,
    [Doctype],
  ]);
  t("system", [`<!DOCTYPE document SYSTEM "subjects.dtd">`, [Doctype]]);
});
