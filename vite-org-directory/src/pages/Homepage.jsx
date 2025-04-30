import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Navbar from "../components/navbar";
import Loading from "../components/Loading";

const Homepage = () => {
  const [orgs, setOrgs] = useState([]);
  const [userRole, setUserRole] = useState("guest");
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking auth status...");
        const { data } = await supabase.auth.getSession();
        const isLoggedIn = !!data.session;
        console.log("Is user logged in:", isLoggedIn);
        setIsAuthenticated(isLoggedIn);

        // Get user role from localStorage
        const storedRole = localStorage.getItem("userRole");
        if (storedRole) {
          console.log("User role from storage:", storedRole);
          setUserRole(storedRole);
        } else if (isLoggedIn) {
          // Fetch user role if authenticated but role not in localStorage
          const { user } = data.session;
          const { data: userData, error: userError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .single();

          if (!userError && userData) {
            console.log("Fetched user role:", userData.role);
            localStorage.setItem("userRole", userData.role);
            setUserRole(userData.role);
          } else {
            console.log("Setting default role: user");
            localStorage.setItem("userRole", "user");
            setUserRole("user");
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };

    checkAuth();
  }, []);

  // Fetch organizations
  useEffect(() => {
    const fetchOrgs = async () => {
      setLoading(true);
      try {
        console.log("Fetching organizations...");
        const { data, error } = await supabase.from("organization").select("*");

        if (error) {
          console.error("Error fetching organizations:", error.message);
          setOrgs([]);
        } else {
          console.log("Organizations fetched:", data.length);
          setOrgs(data || []);
        }
      } catch (error) {
        console.error("Unexpected error fetching orgs:", error);
        setOrgs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrgs();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <Navbar userRole={userRole} />
      <div className="m-6">
        <h1 className="text-2xl font-bold mb-4">Organizations</h1>

        {orgs.length > 0 ? (
          <div className="flex overflow-x-auto space-x-6 p-4 bg-gray-100 rounded-md">
            {orgs.map((org) => (
              <Link
                key={org.org_id}
                to={`/orgs/${org.slug}`}
                className="min-w-[200px] bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition"
              >
                {org.org_logo && (
                  <img
                    src={org.org_logo}
                    alt={org.org_name}
                    className="w-full h-40 object-contain mb-2"
                  />
                )}
                <h2 className="text-center font-semibold">{org.org_name}</h2>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-100 rounded-md text-center">
            No organizations found.
          </div>
        )}
      </div>
    </>
  );
};

export default Homepage;
