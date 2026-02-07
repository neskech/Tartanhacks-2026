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
      // 1. Handle Sidebar Resizing (Phantom Box on the Right)
      if (isResizing.current && ghostRef.current) {
        // Math is mirrored: Width is distance from RIGHT edge
        const newWidth = Math.max(
          200,
          Math.min(window.innerWidth - e.clientX, window.innerWidth * 0.9),
        );
        currentGhostWidth.current = newWidth;
        ghostRef.current.style.width = `${newWidth}px`;
        return;
      }

      // 2. Proximity Logic for the Button (Right 5%)
      if (!isOpen && containerRef.current) {
        const screenWidth = window.innerWidth;
        const threshold = screenWidth * 0.05;
        const mouseDistanceFromRight = screenWidth - e.clientX;

        if (mouseDistanceFromRight <= threshold) {
          const power = 1 - mouseDistanceFromRight / threshold;
          // Peeks out from the right towards the left
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
      className="flex h-screen w-full bg-transparent"
      style={
        {
          "--peek-offset": "0px",
          "--button-scale": "1",
        } as React.CSSProperties
      }
    >
      {/* 1. MAIN CONTENT AREA (Now on the left) */}
      <main className="flex-1  overflow-auto">{/* Main content here */}</main>

      {/* 2. ACTUAL SIDEBAR (Now on the right) */}
      <aside
        style={{ width: isOpen ? `${sidebarWidth}px` : "0px" }}
        className="relative border-l border-gray-200 bg-white/5 flex-shrink-0 transition-[width] duration-300 ease-in-out z-20"
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
            // Handle moved to the LEFT edge of the sidebar
            className="absolute left-[-4px] top-0 w-[8px] h-full cursor-col-resize z-[110]"
          />
        )}
        <div
          className={`h-full my-6 transition-opacity ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          {children}
        </div>
      </aside>

      {/* 3. PHANTOM BOX (Anchored to the right) */}
      <div
        ref={ghostRef}
        className="fixed top-0 right-0 h-full bg-blue-500/5 backdrop-blur-[1px] border-l-2 border-blue-400 z-[100] opacity-0 pointer-events-none"
      />

      {/* 4. PROXIMITY BUTTON (Mirrored) */}
      <div
        ref={buttonRef}
        style={{
          // Uses 'right' instead of 'left'
          right: isOpen ? `${sidebarWidth}px` : "var(--peek-offset)",
          top: "50%",
          // translateX is positive 50% to center it on the right edge
          transform: `translate(50%, -50%) scale(var(--button-scale))`,
          transition: isResizing.current
            ? "none"
            : "right 0.3s ease-out, transform 0.1s ease-out",
        }}
        className="fixed z-[120]"
      >
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            containerRef.current?.style.setProperty("--peek-offset", "0px");
          }}
          className="
            flex h-12 w-12 items-center justify-center 
            rounded-full border border-gray-200 bg-white 
            shadow-xl transition-colors
            text-gray-600 active:scale-90
          "
        >
          {isOpen ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
      </div>
    </div>
  );
};
