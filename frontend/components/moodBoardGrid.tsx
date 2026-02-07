"use client";
import React from "react";

interface GridProps {
  children: React.ReactNode;
}

export const MoodBoardGrid: React.FC<GridProps> = ({ children }) => {
  return (
    <div className="p-6">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-6 justify-items-center">
        {children}
      </div>
    </div>
  );
};
