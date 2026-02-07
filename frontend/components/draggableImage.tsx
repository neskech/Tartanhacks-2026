"use client";
import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

export interface PlacedImage {
  id: string;
  url: string;
  x: number;
  y: number;
  name: string;
  zIndex: number;
}

interface DraggableImageProps {
  img: PlacedImage;
  onDelete: (id: string) => void;
  onUpdatePos: (id: string, x: number, y: number) => void;
}

export const DraggableImage = ({
  img,
  onDelete,
  onUpdatePos,
}: DraggableImageProps) => {
  const [pos, setPos] = useState({ x: img.x, y: img.y });
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;

    // Find the 'Stage' (the parent div with flex-1 relative)
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    const stageX = rect?.left || 0;
    const stageY = rect?.top || 0;

    offset.current = {
      // This calculates the offset relative to the Stage, not the Screen
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };

    document.body.style.cursor = "grabbing";
  };

  useEffect(() => {
    if (!isDragging.current) {
      setPos({ x: img.x, y: img.y });
    }
  }, [img.x, img.y]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      // Ensure the movement is relative to where the stage starts
      const newX = e.clientX - offset.current.x;
      const newY = e.clientY - offset.current.y;

      setPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = "default";
        onUpdatePos(img.id, pos.x, pos.y);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [pos, img.id, onUpdatePos]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className="absolute group touch-none select-none"
      style={{
        left: `${pos.x}px`, // Use pixels explicitly
        top: `${pos.y}px`,
        zIndex: img.zIndex,
        width: "150px", // Ensure it has a size!
      }}
    >
      <div className="relative border-2 border-transparent group-hover:border-blue-500 rounded-lg transition-colors bg-white shadow-lg">
        <img
          src={img.url}
          alt={img.name}
          className="w-32 h-auto rounded-md pointer-events-none"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(img.id);
          }}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
};
