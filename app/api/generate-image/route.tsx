import { ImageResponse } from "@vercel/og";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const WIDTH = 1080;
const HEIGHT = 1350;

// 🔥 Smart font sizing based on text length
function getFontSize(text: string) {
  const length = text.length;

  if (length < 180) return 64;
  if (length < 350) return 56;
  if (length < 600) return 48;
  if (length < 900) return 36;
  if (length < 1200) return 30;
  return 24;
}

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);

    const text =
      searchParams.get("text") || "Anonymous Confession";

    const fontSize = getFontSize(text);

    // 🔥 Auto-detect backgrounds
    const backgroundsDir = path.join(
      process.cwd(),
      "public",
      "backgrounds"
    );

    const files = fs
      .readdirSync(backgroundsDir)
      .filter((file) =>
        file.match(/\.(jpg|jpeg|png|webp)$/i)
      );

    if (files.length === 0) {
      throw new Error("No background images found");
    }

    const randomBg =
      files[Math.floor(Math.random() * files.length)];

    const imageUrl = `${origin}/backgrounds/${randomBg}`;

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            position: "relative",
            width: WIDTH,
            height: HEIGHT,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Background */}
          <img
            src={imageUrl}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {/* Text Container */}
          <div
            style={{
              display: "flex",
              position: "relative",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: text.length > 700 ? "50px" : "80px",
              maxWidth: "850px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                color: "black",
                fontSize,
                fontWeight: 800,
                lineHeight: 1.5,
                textAlign: "center",
              }}
            >
              {text}
            </div>
          </div>
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
      }
    );
  } catch (err: any) {
    return new Response("Error: " + err.message, {
      status: 500,
    });
  }
}
