import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  try {
    const backgroundsDir = path.join(
      process.cwd(),
      "public",
      "backgrounds"
    );

    const files = fs
      .readdirSync(backgroundsDir)
      .filter((file) =>
        /\.(jpg|jpeg|png|webp)$/i.test(file)
      );

    return Response.json(files);
  } catch (error) {
    return new Response("Failed to load backgrounds", {
      status: 500,
    });
  }
}
