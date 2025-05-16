import { FaHome, FaArrowUp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const ActionButton = ({ type = "home", scrollThreshold = 200 }) => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > scrollThreshold);
    };

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);

    // Initial check
    handleScroll();

    // Clean up
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrollThreshold]);

  const handleClick = () => {
    if (type === "home") {
      navigate("/");
    } else if (type === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Determine if this specific button should be visible
  const shouldBeVisible = type === "home" || (type === "top" && isScrolled);

  return (
    <div
      className={`fixed ${
        type === "home" ? "bottom-6 right-6" : "bottom-8 right-6"
      } transition-all duration-500 ease-in-out ${
        shouldBeVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-16 pointer-events-none"
      }`}
    >
      <button
        onClick={handleClick}
        className="w-12 h-12 rounded-full bg-maroon border-2 border-maroon dark:border-white text-white hover:scale-110 shadow-md flex items-center justify-center transition duration-300 ease-in-out z-50"
      >
        {type === "home" ? <FaHome size={18} /> : <FaArrowUp size={18} />}
      </button>
    </div>
  );
};

export default ActionButton;
