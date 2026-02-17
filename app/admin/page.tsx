"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

type Confession = {
  id: string;
  text: string;
};

export default function AdminPage() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [editedTexts, setEditedTexts] = useState<{ [key: string]: string }>({});
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setAuthorized(true);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchConfessions = async () => {
    const snapshot = await getDocs(collection(db, "confessions"));

    const data: Confession[] = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...(docItem.data() as Omit<Confession, "id">),
    }));

    setConfessions(data);

    const initialTexts: { [key: string]: string } = {};
    data.forEach((c) => {
      initialTexts[c.id] = c.text;
    });

    setEditedTexts(initialTexts);
  };

  useEffect(() => {
    if (authorized) {
      fetchConfessions();
    }
  }, [authorized]);

  const saveEdit = async (confession: Confession) => {
    const newText = editedTexts[confession.id];

    await updateDoc(doc(db, "confessions", confession.id), {
      text: newText,
      edited: true,
      editedAt: Timestamp.now(),
    });

    fetchConfessions();
  };

  const approveConfession = async (confession: Confession) => {
    const finalText = editedTexts[confession.id];

    await addDoc(collection(db, "approvedConfessions"), {
      text: finalText,
      approvedAt: Timestamp.now(),
      scheduledAt: null,
      posted: false,
      imageGenerated: false,
    });

    await deleteDoc(doc(db, "confessions", confession.id));

    fetchConfessions();
  };

  const rejectConfession = async (confession: Confession) => {
    const finalText = editedTexts[confession.id];

    await addDoc(collection(db, "rejectedConfessions"), {
      text: finalText,
      rejectedAt: Timestamp.now(),
    });

    await deleteDoc(doc(db, "confessions", confession.id));

    fetchConfessions();
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen p-8 bg-white text-black">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        <button
          onClick={() => signOut(auth)}
          className="bg-black text-white px-4 py-1 rounded"
        >
          Logout
        </button>
      </div>

      {confessions.map((confession) => {
        const previewText = editedTexts[confession.id] || "";
        const imageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-image?text=${encodeURIComponent(
          previewText
        )}`;

        return (
          <div
            key={confession.id}
            className="border p-4 mb-6 rounded shadow-md"
          >
            <textarea
              className="w-full p-2 border mb-3"
              value={previewText}
              onChange={(e) =>
                setEditedTexts({
                  ...editedTexts,
                  [confession.id]: e.target.value,
                })
              }
            />

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => saveEdit(confession)}
                className="bg-blue-600 text-white px-4 py-1 rounded"
              >
                Save
              </button>

              <button
                onClick={() => approveConfession(confession)}
                className="bg-green-600 text-white px-4 py-1 rounded"
              >
                Approve
              </button>

              <button
                onClick={() => rejectConfession(confession)}
                className="bg-red-600 text-white px-4 py-1 rounded"
              >
                Reject
              </button>
            </div>

            {/* 🔥 LIVE IMAGE PREVIEW */}
            <div className="flex justify-center">
              <img
                src={imageUrl}
                alt="Generated Preview"
                className="rounded-lg shadow-lg border"
                style={{
                  width: "270px", // 1080/4
                  height: "338px", // 1350/4
                  objectFit: "cover",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
