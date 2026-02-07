interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
}

export const Button: React.FC<ButtonProps> = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="rounded bg-transparent px-4 py-2 text-white transition-colors duration-300 hover:bg-blue-600"
    >
      {children}
    </button>
  );
};
