import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text") || "Confession";

  return new ImageResponse(
    (
      <div
        style={{
          background: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "80px",
          fontSize: 48,
          textAlign: "center",
          fontWeight: 600,
          color: "black",
          lineHeight: 1.4,
        }}
      >
        {text}
      </div>
    ),
    {
      width: 1080,
      height: 1080,
    }
  );
}
