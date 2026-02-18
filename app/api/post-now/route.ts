import { NextResponse } from "next/server";

const IG_USER_ID = process.env.INSTAGRAM_USER_ID!;
const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN!;

async function postToInstagram(imageUrl: string, caption: string) {
  // Step 1: Create container
  const containerRes = await fetch(
    `https://graph.facebook.com/v18.0/${IG_USER_ID}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: ACCESS_TOKEN,
      }),
    }
  );

  const containerData = await containerRes.json();
  if (!containerData.id) {
    throw new Error(JSON.stringify(containerData));
  }

  // Step 2: Publish
  const publishRes = await fetch(
    `https://graph.facebook.com/v18.0/${IG_USER_ID}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: ACCESS_TOKEN,
      }),
    }
  );

  return publishRes.json();
}

export async function GET() {
  const imageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-image?text=It%20Works!`;

  const result = await postToInstagram(
    imageUrl,
    "🔥 Auto posting test successful! #confession"
  );

  return NextResponse.json(result);
}
