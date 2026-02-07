"use client";
import React, { useState } from "react";

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

  return (
    <button
      onClick={!isEditing ? onClick : undefined} // Disable main click while editing
      onContextMenu={handleRightClick}
      className="group flex flex-col items-center p-4 transition-all duration-300 w-48"
    >
      {/* Image Preview */}
      <div className="w-full aspect-square overflow-hidden rounded-lg mb-3">
        {!hasError ? (
          <img
            src={imageSrc}
            alt={name}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          /* Fallback Gray Background with an optional icon */
          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Editable Name Section */}
      <div className="w-full text-center">
        {isEditing ? (
          <input
            autoFocus
            className="bg-gray-700 text-white text-sm rounded px-2 py-2 w-full outline-none border border-blue-500 e"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setIsEditing(false)} // Save when clicking away
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span className=" block w-full truncate text-sm font-medium text-gray-300 group-hover:text-white transition-colors line-clamp-2">
            {name}
          </span>
        )}
      </div>
    </button>
  );
};
