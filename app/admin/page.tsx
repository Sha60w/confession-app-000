"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  Timestamp,
} from "firebase/firestore";

const GITHUB_USERNAME = "Sha60w";
const GITHUB_REPO = "confession-app-000";
const BACKGROUND_FOLDER = "/public/backgrounds";

export default function AdminPage() {
  const [text, setText] = useState("");
  const [backgrounds, setBackgrounds] = useState<string[]>([]);
  const [selectedBg, setSelectedBg] = useState<string | null>(null);

  // Fetch backgrounds from GitHub
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

      if (images.length > 0) {
        setSelectedBg(images[0]);
      }
    }

    fetchBackgrounds();
  }, []);

  const handleApprove = async () => {
    if (!text || !selectedBg) return;

    await addDoc(collection(db, "approvedConfessions"), {
      text,
      background: selectedBg, // FULL URL saved
      approvedAt: Timestamp.now(),
      posted: false,
    });

    alert("Confession Approved ✅");
    setText("");
  };

  const previewUrl = selectedBg
    ? `/api/generate-image?text=${encodeURIComponent(
        text
      )}&bg=${encodeURIComponent(selectedBg)}`
    : "";

  return (
    <div
      style={{
        background: "white",
        minHeight: "100vh",
        padding: "40px",
      }}
    >
      <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>
        Admin Dashboard
      </h1>

      {/* Text Input */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Edit confession here..."
        style={{
          width: "100%",
          height: "150px",
          marginTop: "20px",
          padding: "15px",
          fontSize: "16px",
        }}
      />

      {/* Background Selector */}
      <h2 style={{ marginTop: "30px" }}>
        Select Background
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "15px",
          marginTop: "15px",
        }}
      >
        {backgrounds.map((bg) => (
          <img
            key={bg}
            src={bg}
            onClick={() => setSelectedBg(bg)}
            style={{
              width: "100%",
              height: "150px",
              objectFit: "cover",
              cursor: "pointer",
              border:
                selectedBg === bg
                  ? "4px solid blue"
                  : "2px solid transparent",
            }}
          />
        ))}
      </div>

      {/* Preview */}
      <h2 style={{ marginTop: "40px" }}>
        Preview
      </h2>

      {previewUrl && (
        <img
          src={previewUrl}
          style={{
            width: "300px",
            marginTop: "20px",
            border: "1px solid #ddd",
          }}
        />
      )}

      {/* Approve Button */}
      <button
        onClick={handleApprove}
        style={{
          marginTop: "30px",
          padding: "12px 20px",
          fontSize: "16px",
          background: "black",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Approve Confession
      </button>
    </div>
  );
}
