import React from "react";
import { Router } from "lucide-react";
import { BrowserRouter, Route, Routes} from "react-router-dom";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import GoogleCallback from "./pages/GoogleCallback";
import SAdminDashboard from "./pages/SAdminDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoutes from "./utils/ProtectedRoutes";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path ="/" element={<Homepage/>} />
        <Route path ="/login" element={<Login/>} />
        <Route path="/auth/callback" element={<GoogleCallback/>} />
        <Route element={<ProtectedRoutes />}>
          <Route path="/superadmin-dashboard" element={<SAdminDashboard/>} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
