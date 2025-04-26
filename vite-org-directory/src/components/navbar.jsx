import { useState, useEffect, useRef } from "react";
import { FaMoon, FaUserCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const Navbar = ({ userRole }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error fetching user:", error.message);
      } else {
        console.log("Navbar user:", user);
        setUser(user);
      }
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout failed:", error.message);
    } else {
      navigate("/login");
    }
  };

  const avatarUrl = user?.user_metadata?.avatar_url;

  const shouldShowDropdown =
    (userRole === "admin" || userRole === "superadmin") && user;

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

        {shouldShowDropdown && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="w-10 h-10 rounded-full bg-white border border-white flex items-center justify-center text-maroon text-xl transition hover:scale-110 overflow-hidden"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <FaUserCircle className="w-6 h-6" />
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-100 text-black rounded-md shadow-md z-50 border border-gray-200">
                <div className="p-3 border-b">
                  <p className="font-semibold text-sm">
                    {user?.user_metadata?.full_name || "Unnamed User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email || "unknown@example.com"}
                  </p>
                </div>
                <ul className="text-sm">
                  <li className="hover:bg-gray-200 px-4 py-2 cursor-pointer">
                    <Link to="/" className="block w-full h-full">
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
                    <>
                      <li className="hover:bg-gray-200 px-4 py-2 cursor-pointer">
                        <Link
                          to="/superadmin-dashboard"
                          className="block w-full h-full"
                        >
                          Super Admin Dashboard
                        </Link>
                      </li>
                      <li className="hover:bg-gray-200 px-4 py-2 cursor-pointer">
                        <Link
                          to="/add-organization"
                          className="block w-full h-full"
                        >
                          Add Organization
                        </Link>
                      </li>
                    </>
                  )}

                  <li
                    onClick={handleLogout}
                    className="hover:bg-gray-200 px-4 py-2 cursor-pointer text-red-600"
                  >
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
