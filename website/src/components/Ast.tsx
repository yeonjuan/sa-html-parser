import React, { FC } from "react";
import ReactJsonView from "react-json-view";

const Ast: FC<{ value: any }> = (props) => {
  return (
    <ReactJsonView
      src={props.value}
      name={null}
      displayDataTypes={false}
      displayObjectSize={false}
      enableClipboard={false}
      // @ts-ignore
      displayArrayKey={false}
      theme="rjv-default"
      style={{ width: "100%", overflow: "auto" }}
    />
  );
};

export default Ast;
