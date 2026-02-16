import { NextResponse } from "next/server";
import { adminDb, bucket } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection("approvedConfessions")
      .where("posted", "==", false)
      .orderBy("approvedAt", "asc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({
        message: "No posts available.",
      });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    const text = data.text;

    // Generate image from internal API
    const imageResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-image?text=${encodeURIComponent(
        text
      )}`
    );

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    const file = bucket.file(`confessions/${doc.id}.png`);

    await file.save(imageBuffer, {
      metadata: {
        contentType: "image/png",
      },
    });

    const imageUrl = `https://storage.googleapis.com/${bucket.name}/confessions/${doc.id}.png`;

    await adminDb.collection("approvedConfessions").doc(doc.id).update({
      scheduledAt: new Date(),
      posted: true,
      imageGenerated: true,
      imageUrl,
    });

    return NextResponse.json({
      message: "Post scheduled + image generated.",
      id: doc.id,
      imageUrl,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Scheduler failed." },
      { status: 500 }
    );
  }
}
