"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;

    setLoading(true);

    try {
      await addDoc(collection(db, "confessions"), {
        text: text.trim(),
        status: "pending",
        createdAt: Timestamp.now(),
        edited: false,
      });

      setText("");
      alert("Confession submitted!");
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black p-4">
      <textarea
        className="w-full max-w-md p-3 border border-gray-300 rounded mb-4"
        rows={5}
        placeholder="Write your confession..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-black text-white px-6 py-2 rounded"
      >
        {loading ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
}
