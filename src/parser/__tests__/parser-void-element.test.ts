import { ElementNode } from "../../nodes";
import { parse } from "../parser";

const onlyElement = (e: any): e is ElementNode => e.type === "Element";

describe("parser: void element", () => {
  test("basic", () => {
    const result = parse(`<div>
      <area>
      <base>
      <section>
        <img>
      </section>
    </div>`);

    expect(result.children.length).toBe(1);

    const [div] = result.children.filter(onlyElement);
    expect(div.type).toBe("Element");
    expect(div.tagName).toBe("div");

    const [area, base, section] = div.children.filter(onlyElement);
    expect(area.type).toBe("Element");
    expect(area.tagName).toBe("area");

    expect(base.type).toBe("Element");
    expect(base.tagName).toBe("base");
    const [img] = section.children.filter(onlyElement);

    expect(img.type).toBe("Element");
    expect(img.tagName).toBe("img");
  });

  test("basic 2", () => {
    const result = parse(`<div>
      <area>
      <base>
      <section>
        <img>
      </section>
      <div>
        <div>
          <base>
        </div>
        <img>
      </div>
    </div>`);

    // 0 depth
    expect(result.children.length).toBe(1);

    // 1 depth
    const [div] = result.children.filter(onlyElement);
    expect(div.type).toBe("Element");
    expect(div.tagName).toBe("div");

    const [area, base, section, div2] = div.children.filter(onlyElement);
    expect(area.type).toBe("Element");
    expect(area.tagName).toBe("area");
    expect(base.type).toBe("Element");
    expect(base.tagName).toBe("base");

    // 2 depth
    const [img] = section.children.filter(onlyElement);

    expect(img.type).toBe("Element");
    expect(img.tagName).toBe("img");

    // 2 depth
    const [div3, img2] = div2.children.filter(onlyElement);

    expect(div3.type).toBe("Element");
    expect(div3.tagName).toBe("div");

    expect(img2.type).toBe("Element");
    expect(img2.tagName).toBe("img");

    const [base2] = div3.children.filter(onlyElement);

    expect(base2.type).toBe("Element");
    expect(base2.tagName).toBe("base");
  });
});
