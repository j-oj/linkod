import React from "react";
import { Router } from "lucide-react";
import { BrowserRouter, Route, Routes} from "react-router-dom";
import Login from "./components/Login";
import GoogleCallback from "./components/GoogleCallback";
import SAdminDashboard from "./components/SAdminDashboard";
import ProtectedRoutes from "./utils/ProtectedRoutes";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path ="/" element={<Login/>} />
        <Route path ="/login" element={<Login/>} />
        <Route path="/auth/callback" element={<GoogleCallback/>} />


        <Route element={<ProtectedRoutes />}>
          <Route path="/SAdminDashboard" element={<SAdminDashboard/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;
