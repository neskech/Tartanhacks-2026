"use client";
import React from "react";

interface TextBoxProps {
  label: string;
  placeholder?: string;
}

export const PromptTextbox: React.FC<TextBoxProps> = ({
  label,
  placeholder,
}) => {
  return (
    <div className="flex flex-col gap-2 mb-6">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        {label}
      </label>
      <textarea
        placeholder={placeholder}
        className="w-full min-h-[100px] p-3 rounded-xl bg-white/50 border border-gray-200 
                   focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none 
                   transition-all text-sm text-gray-700 resize-none shadow-sm"
      />
    </div>
  );
};
