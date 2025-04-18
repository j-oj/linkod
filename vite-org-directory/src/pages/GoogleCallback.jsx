import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");

  const goToHomePage = () => {
    navigate("/");  
  };

  useEffect(() => {
    const checkSessionAndRole = async () => {
      try {
        // Get the authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          setErrorMsg("Sorry, you are not authorized to view this page.");
          return; 
        }

        // Get the session 
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          setErrorMsg("Session expired. Please log in again.");
          return; 
        }

        // Query the role from user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single(); 
        
        console.log("User ID:", user.id)
        console.log("Role Data:", roleData);
        console.log("Role Error:", roleError);

        if (roleError || !roleData) {
          setErrorMsg("Sorry, you are not authorized to view this page.");
          return; 
        }

        const userRole = roleData.role;

        // Redirect based on the user's role
        if (userRole === "superadmin") {
          navigate("/superadmin-dashboard");
        } else if (userRole === "admin") {
          navigate("/admin-dashboard");
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
    <div>
      {errorMsg && (
        <div style={{ color: "red", textAlign: "center", marginTop: "20px" }}>
          {errorMsg}
        </div>
      )}
      {errorMsg && (
        <button onClick={goToHomePage} style={{ display: "block", margin: "20px auto" }}>
          Go back to Homepage
        </button>
      )}
    </div>
  );
};

export default GoogleCallback;
