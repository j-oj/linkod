import { FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";

const Alert = ({
  message,
  isOpen = true,
  onClose = () => {},
  type = "error", // "error" or "success"
  title,
  buttonText = "Dismiss",
}) => {
  if (!isOpen) return null;

  // Determine colors and icon based on type
  const config = {
    error: {
      icon: <FaExclamationTriangle className="text-red-600 text-3xl" />,
      buttonColor: "bg-red-700 hover:bg-red-800",
      defaultTitle: "Error",
    },
    success: {
      icon: <FaCheckCircle className="text-green-600 text-3xl" />,
      buttonColor: "bg-green-700 hover:bg-green-800",
      defaultTitle: "Success",
    },
  };

  const { icon, buttonColor, defaultTitle } = config[type] || config.error;
  const alertTitle = title || defaultTitle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      <div className="bg-white w-80 md:w-96 rounded-lg shadow-lg border p-6 text-center dark:bg-gray-900 dark:text-white dark:border-gray-700"> {/*added dark mode*/}
        <h2 className="text-lg font-semibold mb-2">{alertTitle}</h2>
        <div className="flex justify-center mb-3">{icon}</div>
        <p className="font-semibold">{message}</p>
        <div className="flex justify-center mt-4">
          <button
            onClick={onClose}
            className={`px-4 py-2 ${buttonColor} text-white rounded-md transition`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Alert;
