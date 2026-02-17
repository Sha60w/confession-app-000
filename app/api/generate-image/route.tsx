import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

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
    const { searchParams } = new URL(request.url);
    const text = searchParams.get("text") || "Anonymous Confession";
    const fontSize = getFontSize(text);

    // 🔥 Fetch backgrounds from GitHub dynamically
    const githubApiUrl =
      "https://api.github.com/repos/Sha60w/confession-app-000/contents/public/backgrounds";

    const headers: Record<string, string> = {};
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(githubApiUrl, { headers });
    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }

    const files = await res.json();

    // Filter only image files and get their raw download URLs
    const images = files
      .filter((file: any) => /\.(jpg|jpeg|png|webp)$/i.test(file.name))
      .map((file: any) => file.download_url);

    if (images.length === 0) {
      throw new Error("No background images found on GitHub");
    }

    const randomBg = images[Math.floor(Math.random() * images.length)];

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
            src={randomBg}
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
              padding: text.length > 700 ? "50px" : "80px",
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
              }}
            >
              {text}
            </div>
          </div>
        </div>
      ),
      { width: WIDTH, height: HEIGHT }
    );
  } catch (err: any) {
    return new Response("Error: " + err.message, { status: 500 });
  }
}
