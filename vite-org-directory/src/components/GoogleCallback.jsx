import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState(""); // State to hold the error message

  useEffect(() => {
    const checkSession = async () => {
      // Check if user is authenticated
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        // Set the error message and redirect to the login page
        setErrorMsg("Sorry, you are not authorized to view this page.");
        // Redirect after showing the message
        setTimeout(() => {
          window.location.replace("/"); // Go back to the login page
        }, 3000); // Delay redirect for 3 seconds 
      } else {
        // After successful authentication, check the session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // Redirect to the dashboard if the session is valid
          navigate("/SAdminDashboard"); 
        } else {
          // If no session, redirect to login
          window.location.replace("/");
        }
      }
    };

    checkSession();
  }, [navigate]);

  return (
    <div>
      {errorMsg && (
        <div style={{ color: "red", textAlign: "center", marginTop: "20px" }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
};

export default GoogleCallback;
