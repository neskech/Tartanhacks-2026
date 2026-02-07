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

  const updateField = (field: Partial<BoardItem>) => {
    onUpdate(item.id, field);
  };

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
      cancel=".nodrag"
    >
      <div className="group relative h-full w-full outline-2 outline-transparent transition-all hover:outline-blue-500">
        <img
          src={imageUrl}
          alt={item.name}
          className="pointer-events-none h-full w-full object-cover select-none"
        />
        <div className="absolute z-50 -top-3 -right-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="relative group/search">

            <button
              className="flex items-center gap-2 cursor-pointer rounded-full bg-blue-600 px-2 py-1 text-white text-xs shadow-md hover:bg-blue-700 transition-colors"
            >
              <ScanSearch size={14} /> Find Similar
            </button>

            <div
              className="absolute right-0 top-full mt-2 w-64 p-4 bg-white/90 backdrop-blur-md border border-gray-200 rounded-xl shadow-xl 
                         hidden group-hover/search:block animate-in fade-in zoom-in-95 duration-200 origin-top-right nodrag cursor-default"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Text Prompt</label>
                  <input
                    type="text"
                    value={item.desc || ""}
                    onChange={(e) => updateField({ desc: e.target.value })}
                    placeholder="e.g. A superhero flying..."
                    className="w-full text-xs p-2 rounded border border-gray-300 bg-white/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                    <span>Pose</span>
                    <span>Text</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={item.lambda ?? 0.95}
                    onChange={(e) => updateField({ lambda: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="text-center text-[10px] text-gray-400">
                    Balance: {item.lambda ?? 0.5}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Results (K)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={item.k ?? 4}
                    onChange={(e) => updateField({ k: parseInt(e.target.value) })}
                    className="w-12 text-xs p-1 text-center rounded border border-gray-300 outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFindSimilar(item);
                  }}
                  className="w-full py-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-lg hover:shadow-lg active:scale-95 transition-all"
                >
                  Run Search
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            title="Delete"
            className="cursor-pointer rounded-full bg-red-500 w-6 h-6 flex items-center justify-center text-white shadow-md hover:bg-red-600 transition-colors"
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