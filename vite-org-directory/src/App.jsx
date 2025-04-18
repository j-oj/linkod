import React from "react";
import { Route, Routes} from "react-router-dom";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import GoogleCallback from "./pages/GoogleCallback";
import SAdminDashboard from "./pages/SAdminDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoutes from "./utils/ProtectedRoutes";


function App() {
  return (
    
    <Routes>
      <Route path ="/" element={<Homepage/>} />
      <Route path ="/login" element={<Login/>} />
      <Route path="/auth/callback" element={<GoogleCallback/>} />

      <Route element={<ProtectedRoutes allowedRole="admin"/>}>
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Route>  

      <Route element={<ProtectedRoutes allowedRole="superadmin"/>}>
        <Route path="/superadmin-dashboard" element={<SAdminDashboard />} />
      </Route> 

    </Routes>

  );
}

export default App;
