import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FaMoon, FaSun } from "react-icons/fa";

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("loading");
  const [adminOrgSlug, setAdminOrgSlug] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isLoginPage = location.pathname === "/login";

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
        error,
      } = await supabase.auth.getUser();

      if (!loggedInUser) {
        setUserRole("guest");
        return;
      }

      setUser(loggedInUser);

      // For Google OAuth logins, the avatar is typically stored in a few possible places
      // Let's check all possible locations
      const metadata = loggedInUser.user_metadata || {};
      const rawMetadata = loggedInUser.raw_user_meta_data || {};

      // Google OAuth specifics
      const identities = loggedInUser.identities || [];
      const googleIdentity = identities.find((id) => id.provider === "google");
      const googleData = googleIdentity?.identity_data || {};

      const fullName =
        metadata.full_name ||
        rawMetadata.full_name ||
        googleData.name ||
        loggedInUser.email?.split("@")[0] ||
        "User";

      let avatar =
        googleData.avatar_url || // From Google identity data
        googleData.picture || // Alternative Google picture field
        metadata.avatar_url || // From user metadata
        rawMetadata.avatar_url || // From raw metadata
        metadata.picture || // Alternative field name
        null;

      console.log("User data:", {
        metadata,
        rawMetadata,
        googleIdentity,
        googleData,
        avatar,
      });

      // If no avatar, create fallback and update user
      if (!avatar) {
        avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          fullName
        )}`;

        try {
          // Update the user metadata with the fallback avatar
          await supabase.auth.updateUser({
            data: { avatar_url: avatar },
          });
        } catch (updateError) {
          console.error("Error updating avatar URL:", updateError);
        }
      }

      // Set the avatar URL regardless of its source
      setAvatarUrl(avatar);

      // Fetch role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", loggedInUser.id)
        .single();

      const role = roleData?.role || "guest";
      setUserRole(role);

      // If admin, fetch org slug
      if (role === "admin") {
        const { data: adminData } = await supabase
          .from("admin")
          .select("org_id")
          .eq("admin_id", loggedInUser.id)
          .maybeSingle();

        if (adminData?.org_id) {
          const { data: orgData } = await supabase
            .from("organization")
            .select("slug")
            .eq("org_id", adminData.org_id)
            .single();

          setAdminOrgSlug(orgData?.slug);
        }
      }
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.theme === "dark" ||
        (!("theme" in localStorage) &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return false;
  });

  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.theme = newTheme ? "dark" : "light";
    document.body.classList.toggle("dark", newTheme);
  };

  // Function to check if a link is active
  const isActiveLink = (path) => {
    // For the home page
    if (path === "/" && location.pathname === "/") {
      return true;
    }
    // For other pages, check if the current path starts with the given path
    // This handles nested routes like /edit-org/some-slug
    if (path !== "/" && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-maroon text-white px-6 py-4 flex justify-between items-center shadow-sm">
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
          onClick={toggleTheme}
          className={`w-12 h-7 flex items-center px-[3px] rounded-full transition-colors duration-300 ${
            isDarkMode ? "bg-yellow-500" : "bg-gray-300"
          }`}
          aria-label="Toggle Dark Mode"
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${
              isDarkMode ? "translate-x-5" : "translate-x-0"
            }`}
          >
            {isDarkMode ? (
              <FaMoon className="text-[12px] text-yellow-600" />
            ) : (
              <FaSun className="text-[12px] text-yellow-400" />
            )}
          </div>
        </button>

        {userRole === "guest" && !isLoginPage && (
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
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.user_metadata?.full_name ||
                        user?.email?.split("@")[0] ||
                        "User"
                    )}`;
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                  {(user?.email?.charAt(0) || "U").toUpperCase()}
                </div>
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-100 text-black rounded-md shadow-md z-50 border border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700 transition-all duration-300 ease-in-out">
                <div className="p-3 border-b">
                  <p className="font-semibold text-sm flex items-center w-full overflow-hidden">
                    <span className="truncate max-w-[60%]">
                      {user?.user_metadata?.full_name ||
                        user?.raw_user_meta_data?.full_name ||
                        user?.email?.split("@")[0] ||
                        "Unnamed User"}
                    </span>
                    <span className="ml-1 text-xs px-2 py-0.5 bg-maroon bg-opacity-10 text-white rounded whitespace-nowrap dark:bg-yellow-400 dark:text-gray-900">
                      {userRole === "superadmin" ? "Super Admin" : "Admin"}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
                <ul className="text-sm">
                  <li>
                    <Link
                      to="/"
                      className={`block px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 relative ${
                        isActiveLink("/")
                          ? "font-bold bg-gradient-to-r from-maroon/10 to-transparent dark:from-mustard/20 pl-6"
                          : ""
                      }`}
                    >
                      {isActiveLink("/") && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-maroon dark:bg-yellow-400"></span>
                      )}
                      Home
                    </Link>
                  </li>
                  {userRole === "admin" && adminOrgSlug && (
                    <li>
                      <Link
                        to={`/edit-org/${adminOrgSlug}`}
                        className={`block px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 relative ${
                          isActiveLink("/edit-org")
                            ? "font-bold bg-gradient-to-r from-maroon/10 to-transparent dark:from-yellow-400/20 pl-6"
                            : ""
                        }`}
                      >
                        {isActiveLink("/edit-org") && (
                          <span className="absolute left-0 top-0 bottom-0 w-1 bg-maroon dark:bg-yellow-400"></span>
                        )}
                        Edit Organization
                      </Link>
                    </li>
                  )}
                  {userRole === "superadmin" && (
                    <>
                      <li>
                        <Link
                          to="/superadmin-dashboard"
                          className={`block px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 relative ${
                            isActiveLink("/superadmin-dashboard")
                              ? "font-bold bg-gradient-to-r from-maroon/10 to-transparent dark:from-yellow-400/20 pl-6"
                              : ""
                          }`}
                        >
                          {isActiveLink("/superadmin-dashboard") && (
                            <span className="absolute left-0 top-0 bottom-0 w-1 bg-maroon dark:bg-yellow-400"></span>
                          )}
                          Super Admin Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/add-organization"
                          className={`block px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 relative ${
                            isActiveLink("/add-organization")
                              ? "font-bold bg-gradient-to-r from-maroon/10 to-transparent dark:from-yellow-400/20 pl-6"
                              : ""
                          }`}
                        >
                          {isActiveLink("/add-organization") && (
                            <span className="absolute left-0 top-0 bottom-0 w-1 bg-maroon dark:bg-yellow-400"></span>
                          )}
                          Add Organization
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/create-admin"
                          className={`block px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 relative ${
                            isActiveLink("/create-admin")
                              ? "font-bold bg-gradient-to-r from-maroon/10 to-transparent dark:from-yellow-400/20 pl-6"
                              : ""
                          }`}
                        >
                          {isActiveLink("/create-admin") && (
                            <span className="absolute left-0 top-0 bottom-0 w-1 bg-maroon dark:bg-yellow-400"></span>
                          )}
                          Create Admin
                        </Link>
                      </li>
                    </>
                  )}
                  <li
                    onClick={handleLogout}
                    className="px-4 py-2 text-red-600 hover:bg-gray-200 cursor-pointer dark:text-mustard dark:hover:bg-gray-700 rounded-b-md"
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
