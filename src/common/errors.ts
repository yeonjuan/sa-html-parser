import { Position } from "./types";

export const TokenizingErrors = {
  ControlCharacterInInputStream: "control-character-in-input-stream",
  NonCharacterInInputStream: "noncharacter-in-input-stream",
  SurrogateInInputStream: "surrogate-in-input-stream",
  NonVoidHtmlElementStartTagWithTrailingSolidus:
    "non-void-html-element-start-tag-with-trailing-solidus",
  EndTagWithAttributes: "end-tag-with-attributes",
  EndTagWithTrailingSolidus: "end-tag-with-trailing-solidus",
  UnexpectedSolidusInTag: "unexpected-solidus-in-tag",
  UnexpectedNullCharacter: "unexpected-null-character",
  UnexpectedQuestionMarkInsteadOfTagName:
    "unexpected-question-mark-instead-of-tag-name",
  InvalidFirstCharacterOfTagName: "invalid-first-character-of-tag-name",
  UnexpectedEqualsSignBeforeAttributeName:
    "unexpected-equals-sign-before-attribute-name",
  MissingEndTagName: "missing-end-tag-name",
  UnexpectedCharacterInAttributeName: "unexpected-character-in-attribute-name",
  UnknownNamedCharacterReference: "unknown-named-character-reference",
  MissingSemicolonAfterCharacterReference:
    "missing-semicolon-after-character-reference",
  UnexpectedCharacterAfterDoctypeSystemIdentifier:
    "unexpected-character-after-doctype-system-identifier",
  UnexpectedCharacterInUnquotedAttributeValue:
    "unexpected-character-in-unquoted-attribute-value",
  EofBeforeTagName: "eof-before-tag-name",
  EofInTag: "eof-in-tag",
  MissingAttributeValue: "missing-attribute-value",
  MissingWhitespaceBetweenAttributes: "missing-whitespace-between-attributes",
  MissingWhitespaceAfterDoctypePublicKeyword:
    "missing-whitespace-after-doctype-public-keyword",
  MissingWhitespaceBetweenDoctypePublicAndSystemIdentifiers:
    "missing-whitespace-between-doctype-public-and-system-identifiers",
  MissingWhitespaceAfterDoctypeSystemKeyword:
    "missing-whitespace-after-doctype-system-keyword",
  MissingQuoteBeforeDoctypePublicIdentifier:
    "missing-quote-before-doctype-public-identifier",
  MissingQuoteBeforeDoctypeSystemIdentifier:
    "missing-quote-before-doctype-system-identifier",
  MissingDoctypePublicIdentifier: "missing-doctype-public-identifier",
  MissingDoctypeSystemIdentifier: "missing-doctype-system-identifier",
  AbruptDoctypePublicIdentifier: "abrupt-doctype-public-identifier",
  AbruptDoctypeSystemIdentifier: "abrupt-doctype-system-identifier",
  CdataInHtmlContent: "cdata-in-html-content",
  IncorrectlyOpenedComment: "incorrectly-opened-comment",
  EofInScriptHtmlCommentLikeText: "eof-in-script-html-comment-like-text",
  EofInDoctype: "eof-in-doctype",
  NestedComment: "nested-comment",
  AbruptClosingOfEmptyComment: "abrupt-closing-of-empty-comment",
  EofInComment: "eof-in-comment",
  IncorrectlyClosedComment: "incorrectly-closed-comment",
  EofInCdata: "eof-in-cdata",
  AbsenceOfDigitsInNumericCharacterReference:
    "absence-of-digits-in-numeric-character-reference",
  NullCharacterReference: "null-character-reference",
  SurrogateCharacterReference: "surrogate-character-reference",
  CharacterReferenceOutsideUnicodeRange:
    "character-reference-outside-unicode-range",
  ControlCharacterReference: "control-character-reference",
  NonCharacterCharacterReference: "noncharacter-character-reference",
  MissingWhitespaceBeforeDoctypeName: "missing-whitespace-before-doctype-name",
  MissingDoctypeName: "missing-doctype-name",
  InvalidCharacterSequenceAfterDoctypeName:
    "invalid-character-sequence-after-doctype-name",
  DuplicateAttribute: "duplicate-attribute",
  NonConformingDoctype: "non-conforming-doctype",
  MissingDoctype: "missing-doctype",
  MisplacedDoctype: "misplaced-doctype",
  EndTagWithoutMatchingOpenElement: "end-tag-without-matching-open-element",
  ClosingOfElementWithOpenChildElements:
    "closing-of-element-with-open-child-elements",
  DisallowedContentInNoscriptInHead: "disallowed-content-in-noscript-in-head",
  OpenElementsLeftAfterEof: "open-elements-left-after-eof",
  AbandonedHeadElementChild: "abandoned-head-element-child",
  MisplacedStartTagForHeadElement: "misplaced-start-tag-for-head-element",
  NestedNoscriptInHead: "nested-noscript-in-head",
  EofInElementThatCanContainOnlyText:
    "eof-in-element-that-can-contain-only-text",
};

export const ParsingErrors = {
  MissingStartElement: "missing-start-element",
};

export class ParsingError {
  constructor(
    public pos: Position,
    public index: number,
    public error: string
  ) {}
}
