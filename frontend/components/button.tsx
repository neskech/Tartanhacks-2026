interface ButtonProps {
    children: React.ReactNode;
    onClick: () => void;
}

export const Button: React.FC<ButtonProps> = ({ children, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="px-4 py-2 bg-transparent text-white rounded hover:bg-blue-600 transition-colors duration-300
            "
        >
            {children}
        </button>
    );
}


























