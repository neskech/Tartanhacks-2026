"use client";
import React, { useState, useEffect, useRef } from "react";

interface ButtonProps {
  key: number;
  initialName: string;
  imageSrc: string;

  onClick: () => void;
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

  // Handle Right Click
  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevents the browser context menu
    setIsEditing(true);
  };

  // Handle pressing "Enter" to save
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.select(); // Highlights all text inside the input
    }
  }, [isEditing]);

  return (
    <button
      onClick={!isEditing ? onClick : undefined}
      onContextMenu={handleRightClick}
      className="
    group flex flex-col items-center 
    p-4 hover:p-3 /* Reduce padding on hover to let content expand */
    bg-white/5 hover:bg-white/10 
    rounded-2xl transition-all duration-300 ease-in-out 
    w-48 overflow-hidden focus:outline-none focus:ring-0
  "
    >
      {/* Image Preview Container */}
      <div
        className="
    w-full aspect-square overflow-hidden rounded-xl 
    mb-3 group-hover:mb-1.5 /* Pull text closer as image expands */
    shadow-md transition-all duration-300 bg-white
  "
      >
        {!hasError ? (
          <img
            src={imageSrc}
            alt={name}
            onError={() => setHasError(true)}
            className="
          w-full h-full object-cover 
           group-hover:scale-103
          transition-transform duration-500
        "
          />
        ) : (
          <div className="w-full h-full bg-transparent  flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
              No Preview
            </span>
          </div>
        )}
      </div>

      {/* Editable Name Section */}
      <div className="w-full h-12 flex items-start justify-center text-center transition-all duration-300">
        {isEditing ? (
          <input
            ref={inputRef}
            autoFocus
            className="
          w-full bg-transparent 
          text-sm font-medium text-center
          outline-none h-[20px] leading-[20px] 
          p-0 m-0 border-none box-content
        "
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
          />
        ) : (
          <p
            className="
        w-full truncate 
        text-sm font-medium 
        text-black/70 group-hover:text-black 
        group-hover:scale-102 /* Slightly enlarge text on hover */
        h-[20px] leading-[20px]
        p-0 m-0 transition-all duration-300
        break-words
      "
          >
            {name}
          </p>
        )}
      </div>
    </button>
  );
};
