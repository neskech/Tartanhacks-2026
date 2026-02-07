"use client";
import React, { useRef, useState } from "react";
import {
  MousePointer2,
  Image as ImageIcon,
  Pencil,
  ChevronDown,
} from "lucide-react";

export const Navbar = ({
  onImageUpload,
}: {
  onImageUpload: (file: File) => void;
}) => {
  const [activeTool, setActiveTool] = useState("select");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
      // Optional: switch tool to select after upload
      setActiveTool("select");
    }
  };

  const navItems = [
    { id: "select", icon: MousePointer2, label: "Select", hasDropdown: true },
    {
      id: "image",
      icon: ImageIcon,
      label: "Upload Image",
      hasDropdown: true,
      onClick: () => fileInputRef.current?.click(),
    },
    { id: "sketch", icon: Pencil, label: "Sketch Tool", hasDropdown: true },
  ];

  return (
    <div className="fixed top-6 m-2 left-1/2 -translate-x-1/2 z-50 ">
      <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1.5 rounded-2xl shadow-lg">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {navItems.map((item) => {
          const isActive = activeTool === item.id;
          const Icon = item.icon;

          return (
            <div key={item.id} className="flex items-center group">
              <button
                onClick={() => {
                  setActiveTool(item.id);
                  if (item.onClick) item.onClick();
                }}
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-[#0c8ce9] text-white shadow-lg shadow-blue-500/20"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                }`}
                title={item.label}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </button>

              {item.hasDropdown && (
                <button className="h-10 px-1 text-gray-500 hover:text-gray-300 transition-colors">
                  <ChevronDown size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Mode Indicator Tooltip (Optional) */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/80 rounded-full border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] text-white font-medium uppercase tracking-widest whitespace-nowrap">
          Current Mode: {activeTool}
        </span>
      </div>
    </div>
  );
};
