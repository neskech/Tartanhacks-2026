"use client";

import { Rnd } from "react-rnd";
import { X, ScanSearch } from "lucide-react"; 
import { BoardItem } from "@/lib/db";

interface CanvasItemProps {
  item: BoardItem;
  onUpdate: (id: string, data: Partial<BoardItem>) => void;
  onDelete: (id: string) => void;
  onFindSimilar: (item: BoardItem) => void; 
}

export const CanvasItem = ({
  item,
  onUpdate,
  onDelete,
  onFindSimilar,
}: CanvasItemProps) => {
  const imageUrl = URL.createObjectURL(item.fileBlob);

  return (
    <Rnd
      size={{ width: item.width, height: item.height }}
      position={{ x: item.x, y: item.y }}
      onDragStop={(e, d) => onUpdate(item.id, { x: d.x, y: d.y })}
      onResizeStop={(e, direction, ref, delta, position) => {
        onUpdate(item.id, {
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height),
          ...position,
        });
      }}
      onMouseDown={() => onUpdate(item.id, { zIndex: Date.now() })}
      style={{ zIndex: item.zIndex }}
      className="group"
      lockAspectRatio={false}
    >
      <div className="group relative h-full w-full outline-2 outline-transparent transition-all hover:outline-blue-500">
        <img
          src={imageUrl}
          alt={item.name}
          className="pointer-events-none h-full w-full object-cover select-none"
        />

        <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFindSimilar(item);
            }}
            title="Find Similar Poses"
            className="cursor-pointer rounded-full bg-blue-600 p-1.5 text-white shadow-md hover:bg-blue-700"
          >
            <ScanSearch size={12} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            title="Delete"
            className="cursor-pointer rounded-full bg-red-500 p-1.5 text-white shadow-md hover:bg-red-600"
          >
            <X size={12} />
          </button>
        </div>

        <div className="pointer-events-none absolute -bottom-6 left-0 rounded bg-black/50 px-2 py-0.5 text-[10px] whitespace-nowrap text-white opacity-0 group-hover:opacity-100">
          {item.name}
        </div>
      </div>
    </Rnd>
  );
};
