"use client";

import { useRef, useState } from "react";
import { extractTextFromFile } from "../lib/extractText";

interface Props {
  onExtracted: (text: string, filename: string) => void;
  label?: string;
}

export function FileUploader({ onExtracted, label = "Upload file" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    setDone(null);

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") setProgressMsg("Reading PDF...");
    else if (ext === "docx") setProgressMsg("Reading Word document...");
    else setProgressMsg("Reading file...");

    const result = await extractTextFromFile(file);

    setLoading(false);
    setProgressMsg("");

    if (result.error) {
      setError(result.error);
      return;
    }

    setDone(`${result.filename} · ${result.text.length.toLocaleString()} chars`);
    onExtracted(result.text, result.filename);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-xl border-2 border-dashed border-white/20 bg-white/[0.02] p-6 text-center transition hover:border-deepBlue hover:bg-white/5"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={handleChange}
          className="hidden"
        />

        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-deepBlue" />
            <span className="text-sm text-gray-300">{progressMsg}</span>
          </div>
        ) : done ? (
          <div className="space-y-1">
            <div className="text-2xl">✅</div>
            <div className="text-sm text-emerald font-semibold">Extracted!</div>
            <div className="text-xs text-gray-400">{done}</div>
            <div className="text-xs text-gray-500 pt-1">
              Tap to upload a different file
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-3xl">📄</div>
            <div className="text-sm font-semibold text-white">{label}</div>
            <div className="text-xs text-gray-400">
              Tap to browse or drop a file here
            </div>
            <div className="text-[10px] text-gray-500 pt-1">
              Supports PDF, DOCX, TXT · Max 15,000 chars
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 rounded-lg bg-red-500/10 p-2 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
