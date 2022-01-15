import * as React from "react";
import styled from "styled-components";

const baseStyle = {
  flex: "1",
  display: "flex",
};

const styleB = {
  ...baseStyle,
  minWidth: 0,
  minHeight: 0,
};
const Divider = styled.div`
  background: grey;
  width: 4px;
  &:hover {
    background: black;
    cursor: col-resize;
  }
`;

export default function SplitPane({ vertical, children, onResize }: any) {
  const [position, setPosition] = React.useState(50);
  const container = React.useRef<any>();

  const onMouseDown = React.useCallback(
    function (event) {
      if (!container.current) {
        return;
      }
      event.preventDefault();

      const offset = vertical
        ? container.current.offsetTop
        : container.current.offsetLeft;
      const size = vertical
        ? container.current.offsetHeight
        : container.current.offsetWidth;
      global.document.body.style.cursor = vertical
        ? "row-resize"
        : "col-resize";
      let moveHandler = (event: any) => {
        event.preventDefault();
        const newPosition =
          (((vertical ? event.pageY : event.pageX) - offset) / size) * 100;
        // Using 99% as the max value prevents the divider from disappearing
        setPosition(Math.min(Math.max(0, newPosition), 99));
      };
      let upHandler = () => {
        document.removeEventListener("mousemove", moveHandler);
        document.removeEventListener("mouseup", upHandler);
        global.document.body.style.cursor = "";

        if (onResize) {
          onResize();
        }
      };

      document.addEventListener("mousemove", moveHandler);
      document.addEventListener("mouseup", upHandler);
    },
    [vertical, position, container]
  );

  children = React.Children.toArray(children);

  if (children.length < 2) {
    return (
      <div style={{ display: "flex", minHeight: 0, minWidth: 0 }}>
        {children}
      </div>
    );
  }

  const styleA: any = { ...baseStyle };

  if (vertical) {
    // top
    styleA.minHeight = styleA.maxHeight = position + "%";
  } else {
    // left
    styleA.minWidth = styleA.maxWidth = position + "%";
  }

  return (
    <div
      ref={container}
      style={{
        display: "flex",
        flexDirection: vertical ? "column" : "row",
        minHeight: 0,
        minWidth: 0,
        height: "100%",
      }}
    >
      <div style={styleA}>{children[0]}</div>
      <Divider onMouseDown={onMouseDown} />
      <div style={styleB}>{children[1]}</div>
    </div>
  );
}
