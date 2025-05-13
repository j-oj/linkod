import { FaSearch } from "react-icons/fa";

export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="flex items-center bg-white px-3 py-2 rounded-md shadow-sm w-full max-w-md">
      <FaSearch className="text-gray-500 mr-2" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full focus:outline-none text-sm"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}