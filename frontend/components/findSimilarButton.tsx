"use client";
import { ScanSearch } from "lucide-react";
import react from "react";

interface ButtonProps {
  onClick: () => void;
}

export const FindSimilarButton: React.FC<ButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-3 px-4 
                 bg-gradient-to-r from-blue-600 to-indigo-600 
                 hover:from-blue-700 hover:to-indigo-700
                 text-white rounded-xl font-semibold text-sm
                 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
    >
      <ScanSearch size={18} />
      Find Similar Pose
    </button>
  );
};
