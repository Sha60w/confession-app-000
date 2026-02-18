import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

const WIDTH = 1080;
const HEIGHT = 1350;

const GITHUB_USERNAME = "Sha60w";
const GITHUB_REPO = "confession-app-000";
const BACKGROUND_FOLDER = "/public/backgrounds";

function getFontSize(text: string) {
  const length = text.length;
  if (length < 180) return 64;
  if (length < 350) return 56;
  if (length < 600) return 48;
  if (length < 900) return 36;
  if (length < 1200) return 30;
  return 24;
}

async function getRandomBackground() {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${BACKGROUND_FOLDER}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
      },
      next: { revalidate: 3600 }, // cache 1 hour
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch backgrounds from GitHub");
  }

  const files = await res.json();

  const imageFiles = files.filter((file: any) =>
    /\.(jpg|jpeg|png|webp)$/i.test(file.name)
  );

  if (imageFiles.length === 0) {
    throw new Error("No background images found");
  }

  const random =
    imageFiles[Math.floor(Math.random() * imageFiles.length)];

  return `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/main/${BACKGROUND_FOLDER}/${random.name}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const text =
      searchParams.get("text") || "Anonymous Confession";

    let background = searchParams.get("bg");

    if (!background) {
      background = await getRandomBackground();
    }

    const fontSize = getFontSize(text);

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
          <img
            src={background}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

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
