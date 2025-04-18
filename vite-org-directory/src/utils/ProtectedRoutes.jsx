import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ProtectedRoutes = ({ allowedRole }) => {
  const [isAllowed, setIsAllowed] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const verifyAccess = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setIsAllowed(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

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
      setIsAllowed(roleData.role === allowedRole);
    };

    verifyAccess();
  }, [allowedRole]);

  if (isAllowed === null) {
    return <div>Loading...</div>; 
  }

  // Keep authenticated users on their own dashboard
  if (!isAllowed) {
    if (currentRole === "superadmin") {
      return <Navigate to="/superadmin-dashboard" replace />;
    }
    if (currentRole === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoutes;