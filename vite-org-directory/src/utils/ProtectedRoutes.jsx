import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import Loading from "@/components/loading.jsx";

const ProtectedRoutes = ({ allowedRoles = [] }) => {
  const [isAllowed, setIsAllowed] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const verifyAccess = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.error("No active session found. Redirecting to login.");
        setIsAllowed(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (roleError || !roleData?.role) {
        setIsAllowed(false);
        return;
      }

      setCurrentRole(roleData.role); // Store user role
      setIsAllowed(allowedRoles.includes(roleData.role));
    };

    verifyAccess();
  }, [allowedRoles]);

  if (isAllowed === null) {
    return <Loading />;
  }

  // Redirect to login if the user is not allowed
  if (!isAllowed) {
    console.error(
      `Access denied. Current role: ${currentRole}, Allowed role: ${allowedRoles}`
    );
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoutes;
