"use client";

import React, { useState, useEffect, useRef } from "react";

interface ButtonProps {
  id: string;
  initialName: string;
  imageSrc: string;
  onClick: () => void;
  onRename: (id: string, newName: string) => void;
}

export default function MoodboardButton({
  id,
  initialName,
  imageSrc,
  onClick,
  onRename,
}: ButtonProps) {
  const [name, setName] = useState(initialName);
  const [isEditing, setIsEditing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (name !== initialName) onRename(id, name);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div className="group flex w-48 flex-col items-center overflow-hidden rounded-2xl bg-white/5 p-4 transition-all duration-300 ease-in-out hover:bg-white/10 hover:p-3">
      <div
        onClick={onClick}
        className="mb-3 aspect-square w-full cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 group-hover:mb-1.5 active:scale-95"
      >
        {!hasError ? (
          <img
            src={imageSrc}
            alt={name}
            onError={() => setHasError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] font-medium text-gray-500 uppercase">
              No Preview
            </span>
          </div>
        )}
      </div>

      <div
        className="flex h-12 w-full items-start justify-center text-center"
        onClick={startEditing}
        onContextMenu={startEditing}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            className="m-0 h-6 w-full rounded-md border-none bg-white/20 p-0 text-center text-sm leading-6 font-medium outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            onClick={(e) => e.stopPropagation()} 
          />
        ) : (
          <p className="m-0 h-5 w-full cursor-text truncate rounded-md p-0 text-sm leading-5 font-medium text-black/70 transition-all duration-300 group-hover:text-black">
            {name}
          </p>
        )}
      </div>
    </div>
  );
}
