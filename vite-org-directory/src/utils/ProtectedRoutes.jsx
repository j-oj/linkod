import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import Loading from "@/components/loading.jsx";

const ProtectedRoutes = ({ allowedRole }) => {
  const [isAllowed, setIsAllowed] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const verifyAccess = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("Session:", session);

      if (!session) {
        console.error("No active session found. Redirecting to login.");
        setIsAllowed(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("User:", user);

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      console.log("Role data:", roleData);
      console.error("Role error:", roleError);

      if (roleError || !roleData?.role) {
        setIsAllowed(false);
        return;
      }

      setCurrentRole(roleData.role); // Store user role
      setIsAllowed(roleData.role === allowedRole);
    };

    verifyAccess();
  }, [allowedRole]);

  if (isAllowed === null) {
    return (
      <>
        <Loading />
      </>
    );
  }

  console.log("Current role:", currentRole);
  console.log("Allowed role:", allowedRole);

  return <Outlet />;
};

export default ProtectedRoutes;
