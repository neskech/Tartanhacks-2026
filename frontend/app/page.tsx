"use client";
import { AppHeader } from "@/components/appHeader";
import { MoodBoardButton } from "@/components/moodBoardButton";
import { MoodBoardGrid } from "@/components/moodBoardGrid";
import { CollapsibleSidebar } from "@/components/collapsibleSidebar";
import { FindSimilarButton } from "@/components/findSimilarButton";
import { PromptTextbox } from "@/components/promptTextbox";

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
export default function Home() {
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
      </main> */}
      <div className="flex h-screen w-full overflow-hidden">
        {/* 1. Main Content (The Left Side) */}
        <div className="flex-1 overflow-auto">
          {/* Your Grid/Header goes here */}
        </div>
        <CollapsibleSidebar>
          <h2 className="text-lg font-bold mb-4 text-gray-800">Pose Details</h2>

          <PromptTextbox
            label="Description"
            placeholder="Add notes about the lighting or camera angle..."
          />

          <div className="mt-auto">
            <FindSimilarButton onClick={() => console.log("Searching...")} />
          </div>
        </CollapsibleSidebar>
      </div>
    </div>
  );
}
