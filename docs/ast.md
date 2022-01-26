- [Base](#base)
- [Root](#root)
- [Element](#element)
  - [OpeningElement](#openingelement)
  - [ClosingElement](#closingelement)
- [Text](#text)
- [Comment](#comment)
- [Doctype](#doctype)
  - [DoctypeId](#doctypeid)
  - [DoctypeName](#doctypename)
- [Token](#token)

# Base

```ts
interface Base {}
```

# Root

```ts
interface HTMLRoot extends Base {
  type: "Root";
  children: Array<Element | Text | Comment | Doctype>;
  comments: Array<Comment>;
  tokens: Array<Token>;
}
```

# Element

```ts
interface Element extends Base {
  type: "Element";
  openingElement: OpeningElement;
  closingElement: ClosingElement | null;
  children: Array<Element | Text | Comment>;
}
```

## OpeningElement

```ts
interface OpeningElement extends Base {
  type: "OpeningElement";
  attributes: Attribute[];
  name: ElementName;
  selfClosing: boolean;
}
```

## ClosingElement

```ts
interface ClosingElement extends Base {
  type: "ClosingElement";
  name: ElementName;
}
```

## Attribute

```ts
interface Attribute extends Base {
  type: "Attribute";
  name: AttributeName;
  value: AttributeValue | null;
}
```

### AttributeName

```ts
interface AttributeName extends Base {
  type: "AttributeName";
  value: string;
}
```

### AttributeValue

```ts
interface AttributeValue extends Base {
  type: "AttributeValue";
  value: string;
}
```

# Text

```ts
interface Text extends Base {
  type: "Text";
  value: string;
}
```

# Comment

```ts
interface Comment extends Base {
  type: "Comment";
  value: string;
}
```

# Doctype

```ts
interface Doctype extends Base {
  type: "Doctype";
  publicId: DoctypeId | null;
  systemId: SystemId | null;
  name: DoctypeName;
}
```

## DoctypeId

```ts
interface DoctypeId extends Base {
  type: "DoctypeId";
  value: string;
}
```

## DoctypeName

```ts
interface DoctypeName extends Base {
  type: "DoctypeName";
  value: string;
}
```

## Token

```ts
interface Token extends Base {
  type:
    | "TagName"
    | "AttributeName"
    | "AttributeValue"
    | "Punctuator"
    | "Characters"
    | "WhiteSpaces"
    | "NullCharacter";
  value: string;
}
```
