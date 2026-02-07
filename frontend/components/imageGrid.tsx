"use client";
import { ImageButton } from "@/components/imageButton";

export interface ImageItemProps {
  url: string;
  label: string;
  id?: string;
}

export const ImageGrid = ({
  onAdd,
}: {
  onAdd: (url: string, label: string) => void;
}) => {
  const sampleLibrary: ImageItemProps[] = [
    {
      id: "p1",
      label: "Standing Pose",
      url: "https://picsum.photos/seed/p1/200/300",
    },
    {
      id: "p2",
      label: "Sitting Action",
      url: "https://picsum.photos/seed/p2/200/300",
    },
    {
      id: "p3",
      label: "Dynamic Jump",
      url: "https://picsum.photos/seed/p3/200/300",
    },
    {
      id: "p4",
      label: "Yoga Stretch",
      url: "https://picsum.photos/seed/p4/200/300",
    },
    {
      id: "p5",
      label: "Standing Pose",
      url: "https://picsum.photos/seed/p1/200/300",
    },
    {
      id: "p6",
      label: "Sitting Action",
      url: "https://picsum.photos/seed/p2/200/300",
    },
    {
      id: "p7",
      label: "Dynamic Jump",
      url: "https://picsum.photos/seed/p3/200/300",
    },
    {
      id: "p8",
      label: "Yoga Stretch",
      url: "https://picsum.photos/seed/p4/200/300",
    },
    {
      id: "p9",
      label: "Standing Pose",
      url: "https://picsum.photos/seed/p1/200/300",
    },
    {
      id: "p10",
      label: "Sitting Action",
      url: "https://picsum.photos/seed/p2/200/300",
    },
    {
      id: "p11",
      label: "Dynamic Jump",
      url: "https://picsum.photos/seed/p3/200/300",
    },
    {
      id: "p12",
      label: "Yoga Stretch",
      url: "https://picsum.photos/seed/p4/200/300",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 p-1">
        {sampleLibrary.map((item) => (
          <ImageButton key={item.id} item={item} onAdd={onAdd} />
        ))}
      </div>
    </div>
  );
};
