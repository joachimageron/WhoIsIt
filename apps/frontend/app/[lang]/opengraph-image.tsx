import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const alt = "Who Is It - The Mystery Character Game";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: "linear-gradient(to bottom right, #F07507, #FFE207)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 80,
            fontWeight: "bold",
            marginBottom: 20,
          }}
        >
          Who Is It?
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 32,
            fontWeight: "normal",
            opacity: 0.9,
          }}
        >
          The Mystery Character Game
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
