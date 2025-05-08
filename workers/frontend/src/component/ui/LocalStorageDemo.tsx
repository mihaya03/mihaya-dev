"use client";

import { useState, useEffect } from "react";

export default function LocalStorageDemo() {
  const STORAGE_KEY = "nextjs-sample-value";

  const [inputValue, setInputValue] = useState("");
  const [storedValue, setStoredValue] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const item = localStorage.getItem(STORAGE_KEY);
        if (item) {
          setStoredValue(item);
        }
      } catch (error) {
        console.error("LocalStorage読み込みエラー:", error);
      }
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, inputValue);
      setStoredValue(inputValue);
      setInputValue("");
      alert("値をLocalStorageに保存しました！");
    } catch (error) {
      console.error("LocalStorage保存エラー:", error);
      alert("保存に失敗しました。ブラウザの設定を確認してください。");
    }
  };

  const handleDelete = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStoredValue(null);
    alert("値をLocalStorageから削除しました！");
  };

  return (
    <div className="flex flex-col gap-4 p-6 border rounded-lg w-full max-w-md bg-zinc-800/20">
      <h2 className="text-xl font-bold">LocalStorage デモ</h2>

      <div className="flex flex-col gap-2">
        <label htmlFor="storage-input" className="font-semibold">
          保存する値:
        </label>
        <input
          id="storage-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="p-2 border rounded bg-transparent border-zinc-600 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
          placeholder="何かテキストを入力..."
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition-colors"
        >
          保存
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 px-4 py-2 font-bold text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
        >
          削除
        </button>
      </div>

      <div className="p-4 mt-4 bg-zinc-900/50 rounded-lg">
        <p className="font-semibold">現在LocalStorageに保存されている値:</p>
        <p className="mt-2 text-2xl font-mono text-cyan-300 break-words">
          {storedValue ? `"${storedValue}"` : "（値がありません）"}
        </p>
      </div>
    </div>
  );
}
