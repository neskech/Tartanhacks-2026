"use client";

interface GridProps {
  children: React.ReactNode;
}

export default function MoodBoardGrid({ children }: GridProps) {
  return (
    <div className="p-6">
      <div className="gallery-grid justify-items-center gap-6">{children}</div>
    </div>
  );
}
