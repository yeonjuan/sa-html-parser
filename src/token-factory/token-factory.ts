import { IToken, Token } from "../token";
import { TokenPositionInfoAPI } from "../tokenizer";

export class TokenFactory {
  public static createEOF(posInfoApi: TokenPositionInfoAPI): IToken {
    return Token.create(
      "EOF",
      "",
      posInfoApi.getCurrentRangeIndex(),
      posInfoApi.getCurrentPos()
    );
  }
}
