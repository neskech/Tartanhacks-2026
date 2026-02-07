"use client";

import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

import AppHeader from "@/components/sections/appHeader";
import MoodBoardGrid from "@/components/sections/moodBoardGrid";
import MoodBoardButton from "@/components/moodBoardButton";

export default function Home() {
  const router = useRouter();
  const boards = useLiveQuery(() => db.boards.toArray());

  const handleRename = async (id: string, newName: string) => {
    await db.boards.update(id, { name: newName });
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-size-[20px_20px]">
      <AppHeader />

      <MoodBoardGrid>
        {boards
          ?.slice()
          .reverse()
          .map((board) => (
            <MoodBoardButton
              key={board.id}
              id={board.id}
              initialName={board.name}
              imageSrc={
                board.thumbnail || "https://placehold.co/600x400/png?text=New"
              }
              onClick={() => router.push(`/board/${board.id}`)}
              onRename={handleRename}
            />
          ))}
      </MoodBoardGrid>
    </main>
  );
}
