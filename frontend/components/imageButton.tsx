"use client";
import { ImageItemProps } from "@/components/imageGrid";
interface imageButtonProps {
  item: ImageItemProps;
  onAdd: (url: string, label: string) => void;
}
import React from "react";
export const ImageButton = ({ item, onAdd }: imageButtonProps) => {
  return (
    <button
      onClick={() => onAdd(item.url, item.label)}
      className="group relative aspect-square w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition-all hover:ring-2 hover:ring-blue-500 active:scale-95"
    >
      <img
        src={item.url}
        alt={item.label}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
      />

      {/* Label Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="text-[10px] font-medium text-white truncate text-left">
          {item.label}
        </p>
      </div>
    </button>
  );
};
