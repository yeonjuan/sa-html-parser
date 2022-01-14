import type {
  CommentNode,
  ElementNode,
  TextNode,
  DoctypeNode,
  AttributeNode,
} from "./nodes";

export type AnyNode =
  | ElementNode
  | TextNode
  | DoctypeNode
  | CommentNode
  | AttributeNode;
