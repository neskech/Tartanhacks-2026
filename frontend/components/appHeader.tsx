"use client";
import React from "react";
import { AddMoodBoardButton } from "@/components/addMoodBoardButton";

export const AppHeader: React.FC = () => {
  return (
    <header className="w-full p-4 flex justify-between items-center border-b border-gray-50 bg-white/50 backdrop-blur-md sticky top-0 z-50 shadow">
      {/* Left Aligned Title */}
      <h1 className="text-xl font-bold tracking-tight ">
        PoseFinder
      </h1>

      {/* Right Aligned Button */}
      <AddMoodBoardButton onClick={() => console.log("Add Mood Board")} />
    </header>
  );
};
