import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { useNavigate } from "react-router-dom";
import { FaLock } from "react-icons/fa";

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");

  const goToHomePage = () => {
    navigate("/");
  };

  useEffect(() => {
    const checkSessionAndRole = async () => {
      try {
        await supabase.auth.getSessionFromUrl();
        // Fetch the authenticated user
        const {
          data: { user },
          error: userError,s
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("User error:", userError);
          setErrorMsg("Sorry, you are not authorized to view this page.");
          return;
        }
        console.log("User:", user); // Log the user data

        // Fetch the session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          console.error("Session error:", sessionError);
          setErrorMsg("Session expired. Please log in again.");
          return;
        }
        console.log("Session:", session); // Log the session data

        // Fetch the user's role from the database
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (roleError || !roleData) {
          console.error("Role error:", roleError);
          setErrorMsg("Sorry, you are not authorized to view this page.");
          return;
        }
        console.log("Role data:", roleData); // Log the role data

        // Check the user's role and navigate accordingly
        const userRole = roleData.role;

        if (userRole === "superadmin") {
          navigate("/superadmin-dashboard");
        } else if (userRole === "admin") {
          navigate("/");
        } else {
          setErrorMsg("Unauthorized role.");
        }
      } catch (error) {
        console.error("Error during session validation:", error);
        setErrorMsg("An unexpected error occurred. Please try again.");
      }
    };

    checkSessionAndRole();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 px-4">
      {errorMsg && (
        <div className="bg-red-100 text-red-700 border border-red-400 px-10 py-12 rounded-xl shadow-md text-center max-w-md">
          <div className="flex justify-center mb-4">
            <FaLock className="text-4xl text-maroon" />
          </div>

          <p className="mb-4 font-medium">{errorMsg}</p>

          <button
            onClick={goToHomePage}
            className="bg-maroon text-white px-4 py-2 rounded hover:bg-red-800 transition"
          >
            Go back to Homepage
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleCallback;
