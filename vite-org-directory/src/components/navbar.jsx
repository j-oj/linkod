import { useState, useEffect, useRef } from "react";
import { FaMoon } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

const Navbar = (props) => {
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

        {(userRole === "admin" || userRole === "superadmin") && (
          <div className="hidden md:block text-sm mr-3">
            <span>
              Maayong adlaw,{" "}
              {
                (
                  user?.user_metadata?.full_name ||
                  user?.raw_user_meta_data?.full_name ||
                  user?.email?.split("@")[0] ||
                  "User"
                ).split(" ")[0]
              }
              !
            </span>
          </div>
        )}

        <button
          className="px-4 py-2 text-xl bg-yellow-500 dark:bg-maroon-500 border-yellow-200 rounded-md"
          onClick={() => document.body.classList.toggle("dark")}
        >
          <FaMoon />
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
            <button bg-yellow
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
              <div className="absolute right-0 mt-2 w-56 bg-gray-100 text-black rounded-md shadow-md z-50 border border-gray-200">
                <div className="p-3 border-b">
                  <p className="font-semibold text-sm flex items-center w-full overflow-hidden">
                    <span className="truncate max-w-[60%]">
                      {user?.user_metadata?.full_name ||
                        user?.raw_user_meta_data?.full_name ||
                        user?.email?.split("@")[0] ||
                        "Unnamed User"}
                    </span>
                    <span className="ml-1 text-xs px-2 py-0.5 bg-maroon bg-opacity-10 text-white rounded whitespace-nowrap">
                      {userRole === "superadmin" ? "Super Admin" : "Admin"}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
                <ul className="text-sm">
                  <li>
                    <Link to="/" className="block px-4 py-2 hover:bg-gray-200">
                      Home
                    </Link>
                  </li>
                  {userRole === "admin" && adminOrgSlug && (
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
