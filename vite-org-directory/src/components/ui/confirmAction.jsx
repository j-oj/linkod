import { FaExclamationTriangle } from "react-icons/fa";

const ConfirmAction = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  warning = "Are you sure you want to perform this action?",
  subtitle = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      <div className="bg-white w-80 md:w-96 rounded-lg shadow-lg p-6 text-center">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <div className="flex justify-center mb-3">
          <FaExclamationTriangle className="text-red-600 text-3xl" />
        </div>
        <p className="font-semibold">{warning}</p>
        <p className="text-sm text-gray-500 mt-1 mb-4">{subtitle}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAction;
