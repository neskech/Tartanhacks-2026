"use client";
import React, { useState } from "react";
import { Layers, X } from "lucide-react";
import { BoardItem } from "@/lib/db";

interface LayerPanelProps {
  items: BoardItem[];
  onDelete: (id: string) => void;
  onRename: (id: string, data: { name: string }) => void;
}

export const LayerPanel = ({ items, onDelete, onRename }: LayerPanelProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");

  const startEditing = (item: BoardItem) => {
    setEditingId(item.id);
    setTempName(item.name);
  };

  const saveEditing = (id: string) => {
    if (tempName.trim()) onRename(id, { name: tempName });
    setEditingId(null);
  };

  return (
    <div className="z-20 flex h-full w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-14 items-center border-b px-4">
        <h3 className="flex items-center gap-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
          <Layers size={14} /> Layers ({items.length})
        </h3>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {[...items].reverse().map((item) => (
          <div
            key={item.id}
            className="group flex items-center gap-2 rounded border border-transparent p-2 text-sm transition-all hover:border-gray-200 hover:bg-gray-100"
          >
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded bg-gray-200">
              <img
                src={URL.createObjectURL(item.fileBlob)}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              {editingId === item.id ? (
                <input
                  autoFocus
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={() => saveEditing(item.id)}
                  onKeyDown={(e) => e.key === "Enter" && saveEditing(item.id)}
                  className="w-full rounded bg-blue-50 px-1 py-0.5 text-xs outline-none"
                />
              ) : (
                <span
                  onClick={() => startEditing(item)}
                  className="block cursor-text truncate font-medium text-gray-700"
                >
                  {item.name}
                </span>
              )}
            </div>

            <button
              onClick={() => onDelete(item.id)}
              className="text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
