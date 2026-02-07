"use client";
import React, { useState, useEffect, useRef } from "react";

interface ButtonProps {
  initialName: string;
  imageSrc: string;
  onClick: () => void; // Triggered when clicking the image
}

export const MoodBoardButton: React.FC<ButtonProps> = ({
  initialName,
  imageSrc,
  onClick,
}) => {
  const [name, setName] = useState(initialName);
  const [isEditing, setIsEditing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Trigger editing for both Left and Right clicks on the text
  const startEditing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent the image container/button from catching this
    setIsEditing(true);
  };

  

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div
      className="
        group flex flex-col items-center 
        p-4 hover:p-3 
        bg-white/5 hover:bg-white/10 
        rounded-2xl transition-all duration-300 ease-in-out 
        w-48 overflow-hidden
      "
    >
      {/* 1. Image Container - Handles Navigation */}
      <div
        onClick={onClick}
        className="
          w-full aspect-square overflow-hidden rounded-xl 
          mb-3 group-hover:mb-1.5 
          shadow-md transition-all duration-300 bg-white
          cursor-pointer active:scale-95
        "
      >
        {!hasError ? (
          <img
            src={imageSrc}
            alt={name}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] text-gray-500 font-medium uppercase">No Preview</span>
          </div>
        )}
      </div>

      {/* 2. Editable Name Section - Handles Rename */}
      <div 
        className="w-full h-12 flex items-start justify-center text-center"
        onClick={startEditing}
        onContextMenu={startEditing}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            className="
              w-full bg-white/20 rounded-md
              text-sm font-medium text-center
              outline-none h-[24px] leading-[24px] 
              p-0 m-0 border-none 
            "
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
            onClick={(e) => e.stopPropagation()} // Prevent re-triggering startEditing
          />
        ) : (
          <p
            className="
              w-full truncate 
              text-sm font-medium 
              text-black/70 group-hover:text-black 
              h-[20px] leading-[20px]
              p-0 m-0 transition-all duration-300
              cursor-text rounded-md
            "
          >
            {name}
          </p>
        )}
      </div>
    </div>
  );
};