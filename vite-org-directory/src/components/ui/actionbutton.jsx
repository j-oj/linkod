import { FaHome, FaArrowUp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ActionButton = ({ type = "home" }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (type === "home") {
      navigate("/");
    } else if (type === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-maroon border-2 text-white hover:scale-110 shadow-md flex items-center justify-center transition duration-300 ease-in-out z-50"
    >
      {type === "home" ? <FaHome size={18} /> : <FaArrowUp size={18} />}
    </button>
  );
};

export default ActionButton;
