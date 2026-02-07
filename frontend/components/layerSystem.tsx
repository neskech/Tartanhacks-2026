"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, Layers, GripVertical } from "lucide-react";
import { PlacedImage } from "@/components/draggableImage";

export const LayerSystem = ({
  images,
  onDelete,
  setImages,
}: {
  images: PlacedImage[];
  onDelete: (id: string) => void;
  setImages: React.Dispatch<React.SetStateAction<PlacedImage[]>>;
}) => {
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const ghostResizeRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const listItemsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const startEditing = (img: PlacedImage) => {
    setEditingId(img.id);
    setTempName(img.name);
  };

  const saveRename = () => {
    if (editingId) {
      setImages((prev) =>
        prev.map((img) =>
          img.id === editingId ? { ...img, name: tempName || img.name } : img,
        ),
      );
    }
    setEditingId(null);
  };

  const onDragStart = (e: React.MouseEvent, id: string) => {
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("input")
    )
      return;
    setDraggedId(id);
    document.body.style.cursor = "grabbing";
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isResizing.current && ghostResizeRef.current) {
        const newWidth = Math.max(180, Math.min(e.clientX, 500));
        ghostResizeRef.current.style.width = `${newWidth}px`;
        return;
      }

      if (!draggedId || !containerRef.current) return;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      if (e.clientY < rect.top + 40) container.scrollBy({ top: -5 });
      else if (e.clientY > rect.bottom - 40) container.scrollBy({ top: 5 });

      const elementUnderCursor = document.elementFromPoint(
        e.clientX,
        e.clientY,
      );
      const closestItem = elementUnderCursor?.closest("[data-layer-id]");

      if (!closestItem) {
        if (e.clientY > rect.bottom - 50) setDropIndex(images.length);
        return;
      }

      const targetId = closestItem.getAttribute("data-layer-id");
      const visualOrder = [...images].reverse();
      const hoveredIndex = visualOrder.findIndex((img) => img.id === targetId);

      if (hoveredIndex !== -1) {
        const itemRect = closestItem.getBoundingClientRect();
        setDropIndex(
          e.clientY < itemRect.top + itemRect.height / 2
            ? hoveredIndex
            : hoveredIndex + 1,
        );
      }
    },
    [draggedId, images],
  );

  const handleMouseUp = useCallback(() => {
    if (isResizing.current) {
      isResizing.current = false;
      if (ghostResizeRef.current) {
        setSidebarWidth(parseInt(ghostResizeRef.current.style.width));
        ghostResizeRef.current.style.opacity = "0";
      }
    }
    if (draggedId !== null && dropIndex !== null) {
      setImages((prev) => {
        const visualOrder = [...prev].reverse();
        const oldIdx = visualOrder.findIndex((img) => img.id === draggedId);
        const newVisualOrder = [...visualOrder];
        const [movedItem] = newVisualOrder.splice(oldIdx, 1);
        let adjIdx = dropIndex;
        if (oldIdx < dropIndex) adjIdx -= 1;
        newVisualOrder.splice(adjIdx, 0, movedItem);
        return newVisualOrder
          .reverse()
          .map((img, i) => ({ ...img, zIndex: i }));
      });
    }
    setDraggedId(null);
    setDropIndex(null);
    document.body.style.cursor = "default";
  }, [draggedId, dropIndex, setImages]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <>
      <div
        style={{ width: `${sidebarWidth}px` }}
        className="relative border-r bg-gray-50 h-full flex flex-col z-20 overflow-hidden select-none transition-[width] duration-75"
      >
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            isResizing.current = true;
            ghostResizeRef.current!.style.opacity = "1";
          }}
          className="absolute right-0 top-0 w-1.5 h-full cursor-col-resize z-50 hover:bg-blue-500/30 transition-colors"
        />

        <div className="flex items-center px-4 h-14 bg-white border-b border-gray-200">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Layers size={14} /> Layers
          </h3>
        </div>

        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2"
        >
          {[...images].reverse().map((img, index) => (
            <React.Fragment key={img.id}>
              {draggedId && dropIndex === index && (
                <div className="h-1 bg-blue-500 rounded-full w-full animate-pulse mb-1" />
              )}

              <div
                data-layer-id={img.id}
                onMouseDown={(e) => onDragStart(e, img.id)}
                className={`group flex items-center gap-3 bg-white px-2 rounded-lg border transition-all h-[56px] cursor-pointer overflow-hidden ${
                  draggedId === img.id
                    ? "opacity-20 grayscale border-dashed"
                    : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                }`}
              >
                <GripVertical
                  size={16}
                  className="text-gray-300 group-hover:text-gray-500 flex-shrink-0"
                />

                <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden border flex-shrink-0 pointer-events-none">
                  <img
                    src={img.url}
                    className="w-full h-full object-cover"
                    draggable={false}
                    alt=""
                  />
                </div>

                {/* Name Section: Grows horizontally without changing height */}
                <div className="flex-1 min-w-0">
                  {editingId === img.id ? (
                    <input
                      autoFocus
                      className="w-full text-xs font-semibold bg-blue-50 border border-blue-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveRename()}
                      onBlur={saveRename}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      onClick={() => startEditing(img)}
                      className="text-xs font-semibold text-gray-700 truncate block w-full"
                    >
                      {img.name}
                    </span>
                  )}
                </div>

                {/* Hide button while editing to let input expand */}
                {editingId !== img.id && (
                  <button
                    onClick={() => onDelete(img.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-all flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </React.Fragment>
          ))}
          {draggedId && dropIndex === images.length && (
            <div className="h-1 bg-blue-500 rounded-full w-full animate-pulse mt-1" />
          )}
        </div>
      </div>

      <div
        ref={ghostResizeRef}
        className="fixed top-0 left-0 h-full bg-blue-500/5 border-r-2 border-blue-400 z-[100] opacity-0 pointer-events-none"
        style={{ width: `${sidebarWidth}px` }}
      />
    </>
  );
};
