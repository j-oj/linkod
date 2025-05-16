import { FaSearch } from "react-icons/fa";

export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="flex items-center bg-white px-3 py-2 rounded-md shadow-sm w-full max-w-md dark:bg-gray-700 dark:border-white dark:border-opacity-10 border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition duration-200 ease-in-out">
      <FaSearch className="text-gray-500 mr-2 dark:text-gray-300" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full focus:outline-none text-sm bg-transparent placeholder-gray-400 dark:placeholder-gray-400"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
