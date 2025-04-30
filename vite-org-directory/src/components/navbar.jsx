import { useState, useEffect, useRef } from "react";
import { FaMoon, FaUserCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("loading");
  const [adminOrgSlug, setAdminOrgSlug] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setTimeout(() => setDropdownOpen(false), 100);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: loggedInUser },
      } = await supabase.auth.getUser();

      if (!loggedInUser) {
        setUserRole("guest");
        return;
      }

      setUser(loggedInUser);

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", loggedInUser.id)
        .single();

      const role = roleData?.role || "guest";
      setUserRole(role);

      if (role === "admin") {
        const { data: adminData } = await supabase
          .from("admin")
          .select("org_id")
          .eq("admin_id", loggedInUser.id)
          .maybeSingle();

        const { data: orgData } = await supabase
          .from("organization")
          .select("slug")
          .eq("org_id", adminData?.org_id)
          .single();

        setAdminOrgSlug(orgData?.slug);
      }
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="bg-maroon text-white px-6 py-4 flex justify-between items-center relative">
      <div className="flex items-center gap-2">
        <img src="/templogo.png" alt="logo" className="w-12 md:w-14" />
        <Link to="/">
          <span className="text-xl md:text-2xl font-bold">ISK</span>
          <span className="text-xl md:text-2xl font-bold text-yellow-400">
            Org
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4 relative" ref={dropdownRef}>
        <button
          className="text-xl"
          onClick={() => document.body.classList.toggle("dark")}
        >
          <FaMoon />
        </button>

        {userRole === "guest" && (
          <Link
            to="/login"
            className="px-4 py-2 bg-white text-maroon rounded-md font-medium hover:bg-gray-200 transition"
          >
            Login
          </Link>
        )}

        {(userRole === "admin" || userRole === "superadmin") && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-10 h-10 rounded-full bg-white overflow-hidden flex justify-center items-center transition-transform transform hover:scale-110"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <FaUserCircle className="text-maroon text-xl" />
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
                  <li>
                    <Link to="/" className="block px-4 py-2 hover:bg-gray-200">
                      Home
                    </Link>
                  </li>
                  {userRole === "admin" && (
                    <li>
                      <Link
                        to={`/orgs/${adminOrgSlug}`}
                        className="block px-4 py-2 hover:bg-gray-200"
                      >
                        Edit Organization
                      </Link>
                    </li>
                  )}
                  {userRole === "superadmin" && (
                    <>
                      <li>
                        <Link
                          to="/superadmin-dashboard"
                          className="block px-4 py-2 hover:bg-gray-200"
                        >
                          Super Admin Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/add-organization"
                          className="block px-4 py-2 hover:bg-gray-200"
                        >
                          Add Organization
                        </Link>
                      </li>
                    </>
                  )}
                  <li
                    onClick={handleLogout}
                    className="px-4 py-2 text-red-600 hover:bg-gray-200 cursor-pointer"
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
