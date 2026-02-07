"use client";
import { useState } from "react";
import { ChevronRight, ChevronLeft, Search } from "lucide-react";

const SAMPLE_LIBRARY = [
  { url: "https://picsum.photos/seed/1/200/300", label: "Pose A" },
  { url: "https://picsum.photos/seed/2/200/300", label: "Pose B" },
  { url: "https://picsum.photos/seed/3/200/300", label: "Pose C" },
  { url: "https://picsum.photos/seed/4/200/300", label: "Pose D" },
];

export const LibrarySidebar = ({
  onAddFromLibrary,
}: {
  onAddFromLibrary: (url: string, label: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      className={`relative z-20 flex h-full flex-col border-l bg-white transition-all duration-300 ${isOpen ? "w-80" : "w-0"}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-1/2 -left-3 z-50 flex h-12 w-6 -translate-y-1/2 items-center justify-center rounded-l-lg border border-gray-200 bg-white text-gray-500 shadow hover:text-blue-500"
      >
        {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div
        className={`flex h-full flex-col overflow-hidden ${!isOpen && "invisible opacity-0"}`}
      >
        <div className="border-b bg-gray-50 p-4">
          <h2 className="mb-2 font-bold text-gray-700">Library</h2>
          <div className="relative">
            <Search
              size={14}
              className="absolute top-2.5 left-2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search poses..."
              className="w-full rounded-lg border py-2 pr-2 pl-8 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {SAMPLE_LIBRARY.map((img, i) => (
              <button
                key={i}
                onClick={() => onAddFromLibrary(img.url, img.label)}
                className="group relative aspect-2/3 overflow-hidden rounded-lg border bg-gray-100 transition-all hover:ring-2 hover:ring-blue-500"
              >
                <img
                  src={img.url}
                  alt={img.label}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="truncate text-xs text-white">{img.label}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
