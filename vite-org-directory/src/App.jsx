import React from "react";
import { Route, Routes } from "react-router-dom";

import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import GoogleCallback from "./pages/GoogleCallback";
import SAdminDashboard from "./pages/SAdminDashboard";
import AddOrg from "./pages/AddOrg";
import EditOrg from "./pages/EditOrg";
import OrgPage from "./pages/OrgPage";
import CreateAdmin from "./pages/CreateAdmin";

import ProtectedRoutes from "./utils/ProtectedRoutes";
import AppLayout from "./components/AppLayout";
import { LoadingProvider } from "./context/LoadingContext";

function App() {
  return (
    <LoadingProvider>
      <Routes>
        {/* Routes wrapped with layout */}
        <Route element={<AppLayout />}>
          {/* Public Routes */}
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<GoogleCallback />} />
          <Route path="/orgs/:slug" element={<OrgPage />} />

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoutes allowedRole="admin" />}>
            <Route path="/edit-org/:slug" element={<EditOrg />} />
          </Route>

          {/* Superadmin Protected Routes */}
          <Route element={<ProtectedRoutes allowedRole="superadmin" />}>
            <Route path="/superadmin-dashboard" element={<SAdminDashboard />} />
            <Route path="/add-organization" element={<AddOrg />} />
            <Route path="/create-admin" element={<CreateAdmin />} />
          </Route>
        </Route>
      </Routes>
    </LoadingProvider>
  );
}

export default App;
