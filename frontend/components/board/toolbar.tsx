"use client";
import React, { useRef, useState } from "react";
import {
  MousePointer2,
  Image as ImageIcon,
  Pencil,
  ChevronDown,
} from "lucide-react";

export const Toolbar = ({
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
      setActiveTool("select");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const navItems = [
    { id: "select", icon: MousePointer2, label: "Select", hasDropdown: true },
    {
      id: "image",
      icon: ImageIcon,
      label: "Upload Image",
      hasDropdown: true,
      onClick: handleUploadClick,
    },
    { id: "sketch", icon: Pencil, label: "Sketch Tool", hasDropdown: true },
  ];

  return (
    <div className="fixed top-6 left-1/2 z-50 m-2 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1.5 shadow-lg">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* eslint-disable-next-line react-hooks/refs */}
        {navItems.map((item) => {
          const isActive = activeTool === item.id;
          const Icon = item.icon;

          return (
            <div key={item.id} className="group flex items-center">
              <button
                onClick={() => {
                  setActiveTool(item.id);
                  if (item.onClick) item.onClick();
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-[#0c8ce9] text-white shadow-lg shadow-blue-500/20"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                }`}
                title={item.label}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </button>

              {item.hasDropdown && (
                <button className="h-10 px-1 text-gray-500 transition-colors hover:text-gray-300">
                  <ChevronDown size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Mode Indicator Tooltip */}
      <div className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/80 px-3 py-1 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="text-[10px] font-medium tracking-widest whitespace-nowrap text-white uppercase">
          Current Mode: {activeTool}
        </span>
      </div>
    </div>
  );
};
