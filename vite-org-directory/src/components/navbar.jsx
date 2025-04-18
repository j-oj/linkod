import { useState, useEffect, useRef } from "react";
import { FaMoon, FaUserCircle } from "react-icons/fa";
import { Link } from "react-router-dom";

const Navbar = ({ userRole = "admin" }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-maroon text-white px-6 py-4 flex justify-between items-center relative">
      <div className="flex items-center gap-2">
        <img src="/templogo.png" alt="logo" className="w-12 md:w-14" />
        <span className="text-xl md:text-2xl font-bold">Website Name</span>
      </div>

      <div className="flex items-center gap-4 relative" ref={dropdownRef}>
        <button className="text-xl">
          <FaMoon />
        </button>

        {(userRole === "admin" || userRole === "superadmin") && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="w-10 h-10 rounded-full bg-white border-2 border-white flex items-center justify-center text-maroon text-xl transition delay-150 duration-300 ease-in-out hover:scale-110"
            >
              <FaUserCircle />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-100 text-black rounded-md shadow-md z-50 border border-gray-200">
                <div className="p-3 border-b">
                  <p className="font-semibold text-sm">
                    {userRole === "superadmin" ? "Super Admin" : "Admin"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {userRole === "superadmin"
                      ? "superadmin@example.com"
                      : "admin@example.com"}
                  </p>
                </div>
                <ul className="text-sm">
                  <li className="hover:bg-gray-200 px-4 py-2 cursor-pointer">
                    <Link to="/homepage" className="block w-full h-full">
                      Home
                    </Link>
                  </li>

                  {userRole === "admin" && (
                    <li className="hover:bg-gray-200 px-4 py-2 cursor-pointer">
                      <Link
                        to="/admin-dashboard"
                        className="block w-full h-full"
                      >
                        Admin Dashboard
                      </Link>
                    </li>
                  )}

                  {userRole === "superadmin" && (
                    <li className="hover:bg-gray-200 px-4 py-2 cursor-pointer">
                      <Link
                        to="/superadmin-dashboard"
                        className="block w-full h-full"
                      >
                        Super Admin Dashboard
                      </Link>
                    </li>
                  )}

                  <li className="hover:bg-gray-200 px-4 py-2 cursor-pointer text-red-600">
                    Log out
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
