import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

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
        message: "No posts available to schedule.",
      });
    }

    const doc = snapshot.docs[0];

    await adminDb
      .collection("approvedConfessions")
      .doc(doc.id)
      .update({
        scheduledAt: new Date(),
        posted: true,
      });

    return NextResponse.json({
      message: "Post scheduled successfully.",
      id: doc.id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Scheduler failed." },
      { status: 500 }
    );
  }
}
