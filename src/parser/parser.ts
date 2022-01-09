import { CommentNode, Program } from "../nodes";
import { Tokenizer } from "../tokenizer/tokenizer";
import {
  AnyHtmlToken,
  AtomTokenType,
  HtmlTokenType,
  CommentToken,
} from "../tokens";
import { InsertionMode } from "./types";

export class Parser {
  private root!: Program;
  private html!: string;
  private tokenizer!: Tokenizer;
  private insertionMode!: InsertionMode;

  constructor() {}

  public parse(html: string): Program {
    this.html = html;
    this.tokenizer = Tokenizer.create(this.html);
    this.insertionMode = InsertionMode.initialMode;
    this.createProgram();

    while (true) {
      const token = this.tokenizer.getNextToken();
      if (!token || token.type === HtmlTokenType.EOF) {
        break;
      }
      (this as any)[this.insertionMode as any](token);
    }

    return this.root;
  }

  private createProgram() {
    this.root = new Program(0, 0, {
      start: {
        column: 0,
        line: 0,
      },
      end: {
        column: 0,
        line: 0,
      },
    });
  }

  private pushComment(token: CommentToken) {
    this.root.comments.push(CommentNode.fromToken(token));
  }

  private [InsertionMode.initialMode](token: AnyHtmlToken) {
    if (token.type === HtmlTokenType.CharacterLike) {
      if (token.value.type === AtomTokenType.WhiteSpaces) {
        // ignore token
      }
    } else if (token.type === HtmlTokenType.Comment) {
      this.pushComment(token);
    }
  }
}
