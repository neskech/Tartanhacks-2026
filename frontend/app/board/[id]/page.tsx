"use client";

import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { BoardItem, db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Plus, Minus, Maximize } from "lucide-react";

import { CanvasItem } from "@/components/board/canvasItem";
import { LayerPanel } from "@/components/board/layerPanel";
import { Toolbar } from "@/components/board/toolbar";
import { LibrarySidebar } from "@/components/board/librarySidebar";
import { searchSimilarImages } from "@/lib/api";

export default function BoardPage() {
  const params = useParams();
  const boardId = params.id as string;
  const [isSearching, setIsSearching] = useState(false);
  const [searchingId, setSearchingId] = useState<string | null>(null);

  const board = useLiveQuery(() => db.boards.get(boardId), [boardId]);
  const items = useLiveQuery(
    () => db.items.where({ boardId }).sortBy("zIndex"),
    [boardId],
  );

  const handleAddImage = async (
    fileOrUrl: File | string,
    label: string = "Untitled",
    xOffset: number = 0,
    yOffset: number = 0,
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
      x: 100 + xOffset,
      y: 100 + yOffset,
      width: 250,
      height: 250,
      zIndex: maxZ + 1,
    });
  };

  const handleUpdateItem = async (id: string, updates: any) => {
    await db.items.update(id, updates);
  };

  const handleDelete = async (id: string) => {
    await db.items.delete(id);
  };

  const handleFindSimilar = async (item: BoardItem) => {
    setSearchingId(item.id);
    setIsSearching(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(item.fileBlob);
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(",")[1];
        const response = await searchSimilarImages({
          sketch: base64String,
          text: item.desc || "similar pose",
          k: 4,
          lambda: 0.95,
        });

        if (response.success) {
          response.results.forEach((res, index) => {
            const dataUrl = `data:image/jpeg;base64,${res.image}`;
            handleAddImage(
              dataUrl,
              `Result ${index + 1}`,
              item.x + (index + 1) * 270,
              item.y,
            );
          });
        }
        setIsSearching(false);
        setSearchingId(null);
      };
    } catch (e) {
      console.error(e);
      setIsSearching(false);
      setSearchingId(null);
    }
  };

  if (!board) return <div className="p-10 text-gray-400">Loading Board...</div>;

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#f8f9fa]">
      {isSearching && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-none">
          <div className="bg-white px-6 py-3 rounded-full shadow-xl font-bold animate-pulse text-sm">
            Finding similar poses...
          </div>
        </div>
      )}

      <LayerPanel
        items={items || []}
        onDelete={handleDelete}
        onRename={handleUpdateItem}
      />

      <div className="relative flex-1 overflow-hidden">
        <Toolbar onImageUpload={(f) => handleAddImage(f, f.name)} />

        <TransformWrapper
          initialScale={1}
          minScale={0.1}
          maxScale={5}
          centerOnInit={false}
          limitToBounds={false} // Prevents "bouncing" or snapping when panning
          centerZoomedOut={false} // Keeps camera position stable during zoom
          wheel={{ step: 0.1 }}
          panning={{
            disabled: false,
            excluded: ["input", "button", "react-draggable"],
          }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Manual Zoom Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg bg-white p-2 shadow-lg border border-gray-200">
                <button
                  onClick={() => zoomIn()}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <Plus size={20} className="text-gray-600" />
                </button>
                <div className="w-px h-6 bg-gray-200 mx-1" />
                <button
                  onClick={() => zoomOut()}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <Minus size={20} className="text-gray-600" />
                </button>
                <div className="w-px h-6 bg-gray-200 mx-1" />
                <button
                  onClick={() => resetTransform()}
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Reset Canvas View"
                >
                  <Maximize size={18} className="text-gray-600" />
                </button>
              </div>

              <TransformComponent
                wrapperStyle={{ width: "100%", height: "100%" }}
                contentStyle={{ width: "100%", height: "100%" }}
              >
                {/* To act as a stable camera translation, we start the "world" 
                  at a large offset so you have room to pan in all directions.
                */}
                <div
                  className="relative w-[10000px] h-[10000px] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-auto"
                  style={{ transform: "translate(-5000px, -5000px)" }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0])
                      handleAddImage(e.dataTransfer.files[0], "Dropped Image");
                  }}
                >
                  {/* We place the items in the "center" of our 10000px div 
                     so the coordinate (0,0) starts where the user expects.
                   */}
                  <div className="absolute top-[5000px] left-[5000px]">
                    {items?.map((item) => (
                      <CanvasItem
                        key={item.id}
                        item={item}
                        onUpdate={handleUpdateItem}
                        onDelete={handleDelete}
                        onFindSimilar={handleFindSimilar}
                        isSearching={searchingId === item.id}
                      />
                    ))}
                  </div>
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      <LibrarySidebar onAddFromLibrary={handleAddImage} />
    </div>
  );
}
