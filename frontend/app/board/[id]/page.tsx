"use client";

import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

import { CanvasItem } from "@/components/board/canvasItem";
import { LayerPanel } from "@/components/board/layerPanel";
import { Toolbar } from "@/components/board/toolbar";
import { LibrarySidebar } from "@/components/board/librarySidebar";

export default function BoardPage() {
  const params = useParams();
  const boardId = params.id as string;

  const board = useLiveQuery(() => db.boards.get(boardId), [boardId]);

  const items = useLiveQuery(
    () => db.items.where({ boardId }).sortBy("zIndex"),
    [boardId],
  );

  const handleAddImage = async (
    fileOrUrl: File | string,
    label: string = "Untitled",
  ) => {
    let blob: Blob;

    if (typeof fileOrUrl === "string") {
      const response = await fetch(fileOrUrl);
      blob = await response.blob();
    } else {
      blob = fileOrUrl;
    }

    const maxZ =
      items && items.length > 0 ? Math.max(...items.map((i) => i.zIndex)) : 0;

    await db.items.add({
      id: uuidv4(),
      boardId,
      type: "image",
      fileBlob: blob,
      name: label,
      x: 100 + (items?.length || 0) * 10,
      y: 100 + (items?.length || 0) * 10,
      width: 250,
      height: 250,
      zIndex: maxZ + 1,
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdateItem = async (id: string, updates: any) => {
    await db.items.update(id, updates);
  };

  const handleDelete = async (id: string) => {
    await db.items.delete(id);
  };

  if (!board) return <div className="p-10 text-gray-400">Loading Board...</div>;

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#f0f0f0]">
      <LayerPanel
        items={items || []}
        onDelete={handleDelete}
        onRename={handleUpdateItem}
      />

      <div
        className="relative flex-1 overflow-hidden bg-[radial-gradient(#ccc_1px,transparent_1px)] bg-size-[20px_20px]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.[0])
            handleAddImage(e.dataTransfer.files[0], "Dropped Image");
        }}
      >
        <Toolbar onImageUpload={(f) => handleAddImage(f, f.name)} />

        {items?.map((item) => (
          <CanvasItem
            key={item.id}
            item={item}
            onUpdate={handleUpdateItem}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <LibrarySidebar onAddFromLibrary={handleAddImage} />
    </div>
  );
}
