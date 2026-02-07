// components/AddMoodBoardButton.tsx
import { Plus } from "lucide-react";

interface Props {
  onClick: () => void;
}

export const AddMoodBoardButton: React.FC<Props> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="
        flex items-center gap-2 px-4 py-2 
        bg-white/10 backdrop-blur-lg 
        border border-gray-500/30  rounded-full 
        transition-all duration-300
        hover:bg-blue-600/20 hover:border-blue-400/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]
      "
    >
      <Plus size={18} className="text-black-400" />
    </button>
  );
};
