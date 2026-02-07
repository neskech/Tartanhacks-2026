"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const CollapsibleSidebar = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(320);

  const ghostRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const currentGhostWidth = useRef(320);

  const handleGlobalMouseMove = useCallback(
    (e: MouseEvent) => {
      // 1. Handle Sidebar Resizing (Phantom Box)
      if (isResizing.current && ghostRef.current) {
        const newWidth = Math.max(
          200,
          Math.min(e.clientX, window.innerWidth * 0.9),
        );
        currentGhostWidth.current = newWidth;
        ghostRef.current.style.width = `${newWidth}px`;
        return; // Prioritize resizing over proximity logic
      }

      // 2. Proximity Logic for the Button
      if (!isOpen && containerRef.current) {
        const screenWidth = window.innerWidth;
        const threshold = screenWidth * 0.05; // 5% of the screen

        if (e.clientX <= threshold) {
          // Calculate how deep into the 5% we are (0 to 1)
          const power = 1 - e.clientX / threshold;
          // Button "reaches out" up to 40px further
          containerRef.current.style.setProperty(
            "--peek-offset",
            `${power * 40}px`,
          );
          containerRef.current.style.setProperty(
            "--button-scale",
            `${1 + power * 0.2}`,
          );
        } else {
          containerRef.current.style.setProperty("--peek-offset", "0px");
          containerRef.current.style.setProperty("--button-scale", "1");
        }
      }
    },
    [isOpen],
  );

  const stopResizing = useCallback(() => {
    if (!isResizing.current) return;
    isResizing.current = false;
    document.body.style.cursor = "default";
    if (ghostRef.current) ghostRef.current.style.opacity = "0";
    setSidebarWidth(currentGhostWidth.current);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [handleGlobalMouseMove, stopResizing]);

  return (
    <div
      ref={containerRef}
      className="flex h-screen w-full overflow-hidden bg-white"
      style={
        {
          "--peek-offset": "0px",
          "--button-scale": "1",
        } as React.CSSProperties
      }
    >
      {/* 1. ACTUAL SIDEBAR */}
      <aside
        style={{ width: isOpen ? `${sidebarWidth}px` : "0px" }}
        className="relative border-r border-gray-200 bg-white flex-shrink-0 transition-[width] duration-300 ease-in-out z-20"
      >
        {isOpen && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              isResizing.current = true;
              document.body.style.cursor = "col-resize";
              if (ghostRef.current) {
                ghostRef.current.style.opacity = "1";
                ghostRef.current.style.width = `${sidebarWidth}px`;
              }
            }}
            className="absolute right-[-4px] top-0 w-[8px] h-full cursor-col-resize z-[110]"
          />
        )}
        <div
          className={`h-full p-6 transition-opacity ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          {children}
        </div>
      </aside>

      {/* 2. PHANTOM BOX */}
      <div
        ref={ghostRef}
        className="fixed top-0 left-0 h-full bg-blue-500/5 backdrop-blur-[1px] border-r-2 border-blue-400 z-[100] opacity-0 pointer-events-none"
      />

      {/* 3. PROXIMITY BUTTON */}
      <div
        ref={buttonRef}
        style={{
          left: isOpen ? `${sidebarWidth}px` : "var(--peek-offset)",
          top: "50%",
          transform: `translate(-50%, -50%) scale(var(--button-scale))`,
          transition: isResizing.current
            ? "none"
            : "left 0.3s ease-out, transform 0.1s ease-out",
        }}
        className="fixed z-[120]"
      >
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            // Reset peek when opened
            containerRef.current?.style.setProperty("--peek-offset", "0px");
          }}
          className="
            flex h-12 w-12 items-center justify-center 
            rounded-full border border-gray-200 bg-white 
            shadow-x transition-colors
            text-gray-600 active:scale-90
          "
        >
          {isOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </button>
      </div>

      <main className="flex-1 bg-gray-50">{/* Main content here */}</main>
    </div>
  );
};
