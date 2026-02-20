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
  createdAt: Timestamp;
};

const GITHUB_USERNAME = "sha60w";
const GITHUB_REPO = "confession-app-000";
const BACKGROUND_FOLDER = "/public/backgrounds";

export default function AdminPage() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [editedTexts, setEditedTexts] = useState<{ [key: string]: string }>({});
  const [selectedBackgrounds, setSelectedBackgrounds] = useState<{
    [key: string]: string;
  }>({});
  const [backgrounds, setBackgrounds] = useState<string[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  // 🔐 AUTH
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

  // 🔥 Fetch GitHub backgrounds
  useEffect(() => {
    async function fetchBackgrounds() {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${BACKGROUND_FOLDER}`
      );

      const data = await res.json();

      const images = data
        .filter((file: any) =>
          /\.(jpg|jpeg|png|webp)$/i.test(file.name)
        )
        .map(
          (file: any) =>
            `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/main/${BACKGROUND_FOLDER}/${file.name}`
        );

      setBackgrounds(images);
    }

    fetchBackgrounds();
  }, []);

  const getRandomBackground = () => {
    if (backgrounds.length === 0) return "";
    const index = Math.floor(Math.random() * backgrounds.length);
    return backgrounds[index];
  };

  const fetchConfessions = async () => {
    const snapshot = await getDocs(collection(db, "confessions"));

    const data: Confession[] = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...(docItem.data() as Omit<Confession, "id">),
    }));

    setConfessions(data);

    const initialTexts: { [key: string]: string } = {};
    const initialBackgrounds: { [key: string]: string } = {};

    data.forEach((c) => {
      initialTexts[c.id] = c.text;
      initialBackgrounds[c.id] = getRandomBackground();
    });

    setEditedTexts(initialTexts);
    setSelectedBackgrounds(initialBackgrounds);
  };

  useEffect(() => {
    if (authorized && backgrounds.length > 0) {
      fetchConfessions();
    }
  }, [authorized, backgrounds]);

  const changeBackground = (id: string) => {
    setSelectedBackgrounds({
      ...selectedBackgrounds,
      [id]: getRandomBackground(),
    });
  };

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
    const background = selectedBackgrounds[confession.id];

    await addDoc(collection(db, "approvedConfessions"), {
      text: finalText,
      background: background,
      createdAt: confession.createdAt,
      approvedAt: Timestamp.now(),
      posted: false,
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
        const selectedBg = selectedBackgrounds[confession.id];

        const imageUrl =
          selectedBg &&
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-image?text=${encodeURIComponent(
            previewText
          )}&bg=${encodeURIComponent(selectedBg)}`;

        return (
          <div
            key={confession.id}
            className="border p-4 mb-10 rounded shadow-md"
          >
            <textarea
              className="w-full p-2 border mb-4"
              value={previewText}
              onChange={(e) =>
                setEditedTexts({
                  ...editedTexts,
                  [confession.id]: e.target.value,
                })
              }
            />

            {/* 🔥 CHANGE BACKGROUND BUTTON */}
            <div className="mb-4">
              <button
                onClick={() => changeBackground(confession.id)}
                className="bg-purple-600 text-white px-4 py-1 rounded"
              >
                Change Background
              </button>
            </div>

            <div className="flex gap-3 mb-4">
              <button  // save button
                onClick={() => saveEdit(confession)}
                className="bg-blue-600 text-white px-4 py-1 rounded"
              >
                Save
              </button>

              <button // approve button
                onClick={() => approveConfession(confession)}
                className="bg-green-600 text-white px-4 py-1 rounded"
              >
                Approve
              </button>

              <button // reject button
                onClick={() => rejectConfession(confession)}
                className="bg-red-600 text-white px-4 py-1 rounded"
              >
                Reject
              </button>
            </div>

            {/* 🔥 LIVE PREVIEW */}
            {imageUrl && (
              <div className="flex justify-center">
                <img
                  src={imageUrl}
                  alt="Generated Preview"
                  className="rounded-lg shadow-lg border"
                  style={{
                    width: "270px",
                    height: "338px",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
