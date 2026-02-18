import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";

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

  // 2️⃣ Publish media
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
  try {
    // 🔥 Get oldest approved & unposted confession
    const q = query(
      collection(db, "approvedConfessions"),
      where("posted", "==", false),
      orderBy("approvedAt", "asc"),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({
        message: "No posts available.",
      });
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
    await updateDoc(doc(db, "approvedConfessions", postDoc.id), {
      posted: true,
      postedAt: Timestamp.now(),
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
