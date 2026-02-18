import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const IG_USER_ID = process.env.INSTAGRAM_USER_ID!;
const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

async function postToInstagram(imageUrl: string, caption: string) {
  // 1️⃣ Create media container
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

  const creationId = containerData.id;

  // 2️⃣ Wait for media to be ready
  let status = "IN_PROGRESS";
  let attempts = 0;

  while (status === "IN_PROGRESS" && attempts < 10) {
    await new Promise((resolve) => setTimeout(resolve, 3000)); // wait 3 sec

    const statusRes = await fetch(
      `https://graph.facebook.com/v18.0/${creationId}?fields=status_code&access_token=${ACCESS_TOKEN}`
    );

    const statusData = await statusRes.json();

    status = statusData.status_code;
    attempts++;
  }

  if (status !== "FINISHED") {
    throw new Error("Media processing failed or timed out.");
  }

  // 3️⃣ Publish
  const publishRes = await fetch(
    `https://graph.facebook.com/v18.0/${IG_USER_ID}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: ACCESS_TOKEN,
      }),
    }
  );

  return publishRes.json();
}


export async function GET() {
  try {
    // 🔥 Get oldest approved & not posted
    const snapshot = await adminDb
      .collection("approvedConfessions")
      .where("posted", "==", false)
      .orderBy("approvedAt", "asc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ message: "No posts available." });
    }

    const postDoc = snapshot.docs[0];
    const postData = postDoc.data();

    if (!postData.background) {
      throw new Error("Missing background URL");
    }

    const text = postData.text;
    const background = postData.background;

    const imageUrl = `${BASE_URL}/api/generate-image?text=${encodeURIComponent(
      text
    )}&bg=${encodeURIComponent(background)}`;

    // 🔥 Post to Instagram
    const igResult = await postToInstagram(imageUrl, text);

    if (!igResult.id) {
      throw new Error(JSON.stringify(igResult));
    }

    // 🔥 Mark as posted
    await adminDb
      .collection("approvedConfessions")
      .doc(postDoc.id)
      .update({
        posted: true,
        postedAt: new Date(),
        instagramPostId: igResult.id,
      });

    return NextResponse.json({
      success: true,
      instagramPostId: igResult.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
