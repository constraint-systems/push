import { useEffect, useRef, useState } from "react";

type Props = {
  title: string;
};

function MovableBox({ title }: Props) {
  return (
    <div
      style={{
        display: "block",
        position: "fixed",
        background: "#fff",
        color: "#222",
        width: 560,
        maxWidth: "100%",
        maxHeight: "100%",
        overflow: "auto",
        zIndex: 99,
        userSelect: "none",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        border: "solid 1px #222",
      }}
    >
      <div
        style={{
          borderBottom: "solid 1px #222",
          padding: "8px 16px",
          minHeight: 48,
          paddingRight: 56,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div>{title}</div>
        <div
          className="hover"
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: 48,
            height: 48,
            textAlign: "center",
            lineHeight: "48px",
          }}
        >
          X
        </div>
      </div>
      <div
        style={{
          padding: "16px",
        }}
      >
        Push and pull blocks to distort an image. Select a section of the image
        then click and drag it to pull towards you and push away.
      </div>
    </div>
  );
}

export default MovableBox;
