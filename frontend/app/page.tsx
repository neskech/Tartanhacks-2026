"use client";
import { AppHeader } from "@/components/appHeader";
import { MoodBoardButton } from "@/components/moodBoardButton";
import { MoodBoardGrid } from "@/components/moodBoardGrid";
import { CollapsibleSidebar } from "@/components/collapsibleSidebar";
import { FindSimilarButton } from "@/components/findSimilarButton";
import { PromptTextbox } from "@/components/promptTextbox";
import { LayerSystem } from "@/components/layerSystem";
import { ImageGrid } from "@/components/imageGrid";
import { Navbar } from "@/components/navBar";
import React, { useState, useEffect, useCallback, useRef } from "react";
const MOCK_DATA = [
  { id: 1, name: "Kitchen Inspo", image: "../img/dsfgsdfgsdfg.jpeg" },
  { id: 2, name: "Digital Painting Study", image: "../img/img.jpeg" },
  { id: 3, name: "Digasdfasdfasdfy", image: "../img/img.jpeg" },
  { id: 4, name: "Digasdfasdf", image: "@/img/img.jpeg" },
  { id: 5, name: "Digasdfasdfdy", image: "../img/img.jpeg" },
  { id: 6, name: "Digital Painting Study", image: "../img/img.jpeg" },
  { id: 7, name: "Digital Painting Study", image: "../img/img.jpeg" },
  { id: 8, name: "Digital Painting Study", image: "../img/img.jpeg" },
  { id: 9, name: "Digital Painting Study", image: "../img/img.jpeg" },
  { id: 10, name: "Digital Painting Study", image: "../img/img.jpeg" },
  { id: 11, name: "Digital Painting Study", image: "../img/img.jpeg" },
  { id: 12, name: "Digiasdfasdfy", image: "../img/img.jpeg" },
  { id: 13, name: "Digital Painting Study", image: "../img/img.jpeg" },
  { id: 14, name: "Digital Painting Study", image: "../img/img.jpeg" },
  { id: 15, name: "Digital Painting Study", image: "../img/img.jpeg" },
  { id: 16, name: "Digital Painting Study", image: "../img/img.jpeg" },
  { id: 17, name: "Digital Painting Study", image: "../img/img.jpeg" },
  { id: 18, name: "Digital Painting Study", image: "../img/img.jpeg" },
  { id: 19, name: "Digital Painting Study", image: "../img/img.jpeg" },
  { id: 20, name: "Digital Painting Study", image: "../img/img.jpeg" },
  { id: 21, name: "Digital Painting Study", image: "../img/img.jpeg" },
];

// Inside your main SceneEditor or Page component:
import { PlacedImage } from "@/components/draggableImage";
import { DraggableImage } from "@/components/draggableImage";
export default function Home() {
  const [images, setImages] = useState<PlacedImage[]>([]);

  const deleteImage = (id: string) => {
    setImages(images.filter((img) => img.id !== id));
  };

  const handleReorder = (id: string, direction: "up" | "down") => {
    setImages((prevImages) => {
      const index = prevImages.findIndex((img) => img.id === id);
      if (index === -1) return prevImages;

      const newImages = [...prevImages];
      const targetIndex = direction === "up" ? index + 1 : index - 1;

      // Check bounds
      if (targetIndex >= 0 && targetIndex < newImages.length) {
        // Swap elements
        [newImages[index], newImages[targetIndex]] = [
          newImages[targetIndex],
          newImages[index],
        ];

        // Update zIndex property to match new array order
        return newImages.map((img, i) => ({ ...img, zIndex: i }));
      }
      return prevImages;
    });
  };

  const addImage = (url: string, name: string) => {
    const newImage: PlacedImage = {
      id: crypto.randomUUID(),
      url: url,
      name: name,
      x: 300, // Move it further right to avoid sidebar overlap
      y: 200,
      zIndex: images.length, // Put it on top of current images
    };

    setImages((prev) => [...prev, newImage]);
  };
  useEffect(() => {
    if (images.length > 0) {
      console.group("Layer Stack Audit");
      console.table(
        images
          .map((img, index) => ({
            "Z-Index": img.zIndex,
            "Array Index": index,
            Name: img.name,
            ID: img.id.slice(0, 5) + "...",
          }))
          .reverse(), // Reversing so the console matches your UI visual
      );
      console.groupEnd();
    }
  }, [images]);

  return (
    <div>
      {/* <main
        className="min-h-screen  bg-white 
        bg-[linear-gradient(to_right,#f9fafb_1px,transparent_1px),linear-gradient(to_bottom,#f9fafb_1px,transparent_1px)] 
        bg-[size:20px_20px]"
      >
        <AppHeader />
        <MoodBoardGrid>
          {MOCK_DATA.map((board) => (
            <MoodBoardButton
              key={board.id}
              initialName={board.name}
              imageSrc={board.image}
              onClick={() => console.log("Opened", board.name)}
            />
          ))}
        </MoodBoardGrid>
      </main>  */}
      <div className="flex h-screen w-full overflow-hidden ">
        <LayerSystem
          images={images}
          onDelete={deleteImage}
          setImages={setImages}
        ></LayerSystem>

        <div
          className="flex-1 relative overflow-hidden min-h-screen  bg-amber-700
        bg-[linear-gradient(to_right,#f9fafb_1px,transparent_1px),linear-gradient(to_bottom,#f9fafb_1px,transparent_1px)] 
        bg-[size:20px_20px] "
        >
          <Navbar />
          {images.map((img) => (
            <DraggableImage
              key={img.id}
              img={img}
              onDelete={deleteImage}
              onUpdatePos={(id, x, y) => {
                setImages((prev) =>
                  prev.map((i) => (i.id === id ? { ...i, x, y } : i)),
                );
              }}
            />
          ))}
        </div>
        {/* <CollapsibleSidebar>
          <div className="h-full flex flex-col overflow-hidden bg-gray-50">
            <div
              className="relative z-30 p-4 border-b border-white/20 
      bg-white/10 backdrop-blur-xl 
      shadow-lg"
            >
              <div className="absolute inset-0 bg-blue-600/5 -z-10 pointer-events-none" />

              <h2 className="text-lg font-bold mb-4 text-gray-800">
                Pose Details
              </h2>
              <PromptTextbox label="Description" placeholder="Add notes..." />
              <div className="mt-4">
                <FindSimilarButton
                  onClick={() => console.log("Searching...")}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar -mt-[250px] z-10">
              <div className="p-4 pt-[260px]">
                <ImageGrid onAdd={addImage} />
              </div>
            </div>
          </div>
        </CollapsibleSidebar> */}
      </div>
    </div>
  );
}
