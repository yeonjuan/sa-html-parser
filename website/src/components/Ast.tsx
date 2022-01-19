import React from "react";
import Tree from "./Tree";

function formatTime(time) {
  if (!time) {
    return null;
  }
  if (time < 1000) {
    return `${time}ms`;
  }
  return `${(time / 1000).toFixed(2)}s`;
}

export default function ASTOutput({ parseResult = {}, position = null }: any) {
  const { ast = null } = parseResult;
  let output;

  if (parseResult.error) {
    output = (
      <div
        style={{
          padding: 20,
          whiteSpace: "pre-wrap",
          fontFamily: "monospace",
        }}
      >
        {parseResult.error.message}
      </div>
    );
  } else if (ast) {
    output = (
      <>
        {React.createElement(Tree, {
          parseResult,
          position,
        })}
      </>
    );
  }

  return (
    <div className="output highlight">
      <div className="toolbar">
        <span className="time">{formatTime(parseResult.time)}</span>
      </div>
      {output}
    </div>
  );
}
