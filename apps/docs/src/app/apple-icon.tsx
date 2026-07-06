import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#2f52d4",
      }}
    >
      <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
        <path
          d="M6.5 22.5L13 15.5L18.5 18L25 8.5"
          stroke="#faf7f1"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="25" cy="8.5" r="2.9" stroke="#faf7f1" strokeWidth="2" fill="#2f52d4" />
      </svg>
    </div>,
    size,
  );
}
