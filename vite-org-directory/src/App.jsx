import React from "react";
import { Route, Routes } from "react-router-dom";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import GoogleCallback from "./pages/GoogleCallback";
import SAdminDashboard from "./pages/SAdminDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoutes from "./utils/ProtectedRoutes";
import AddOrg from "./pages/AddOrg";
import OrgPage from "./pages/OrgPage";
import { LoadingProvider } from "./context/LoadingContext";
import AppLayout from "./components/AppLayout";

function App() {
  return (
    <LoadingProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<GoogleCallback />} />

          <Route element={<ProtectedRoutes allowedRole="admin" />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Route>

          <Route element={<ProtectedRoutes allowedRole="superadmin" />}>
            <Route path="/superadmin-dashboard" element={<SAdminDashboard />} />
            <Route path="/add-organization" element={<AddOrg />} />
            <Route path="/add-org" element={<AddOrg />} />
            <Route path="/orgs/:slug" element={<OrgPage />} />
          </Route>
        </Route>
      </Routes>
    </LoadingProvider>
  );
}

export default App;
