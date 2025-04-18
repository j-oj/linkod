import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ProtectedRoutes = ({ allowedRole }) => {
  const [isAllowed, setIsAllowed] = useState(null);

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

      setIsAllowed(roleData.role === allowedRole);
    };

    verifyAccess();
  }, [allowedRole]);

 
  if (isAllowed === null) {
    return <div>Loading...</div>; 
  }

  return isAllowed ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoutes;
