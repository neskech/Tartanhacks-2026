"use client";

import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { Plus } from "lucide-react";

export default function AppHeader() {
  const router = useRouter();

  const handleCreateBoard = async () => {
    const newId = uuidv4();

    await db.boards.add({
      id: newId,
      name: "Untitled Board",
      thumbnail: "",
      createdAt: Date.now(),
    });

    router.push(`/board/${newId}`);
  };

  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-gray-50 bg-white/50 p-4 shadow backdrop-blur-md">
      <h1 className="text-xl font-bold tracking-tight">PoseFinder</h1>

      <button
        onClick={handleCreateBoard}
        className="flex items-center rounded-full border border-gray-500/30 bg-white/10 px-4 py-2 backdrop-blur-lg transition-all duration-300 hover:border-gray-400/50 hover:bg-gray-600/20"
      >
        <Plus size={18} className="text-gray-400" />
      </button>
    </header>
  );
}
