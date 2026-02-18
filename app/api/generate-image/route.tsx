import { ImageResponse } from "@vercel/og";

export const runtime = "nodejs";

const WIDTH = 1080;
const HEIGHT = 1350;

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
    const { searchParams } = new URL(request.url);

    const text =
      searchParams.get("text") || "Anonymous Confession";

    // 🔒 Use ONLY passed background
    const background =
      searchParams.get("bg") || "default.jpg";

    const fontSize = getFontSize(text);

    const bgUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/backgrounds/${background}`;

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
            src={bgUrl}
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
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding:
                text.length > 700 ? "50px" : "80px",
              maxWidth: "850px",
              textAlign: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                color: "black",
                fontSize,
                fontWeight: 800,
                lineHeight: 1.5,
                textAlign: "center",
                fontFamily: "Georgia, serif",
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
