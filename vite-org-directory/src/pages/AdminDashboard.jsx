import React from "react";
import Navbar from "../components/navbar";

const AdminDashboard = () => {
  return (
    <>
      <Navbar userRole="admin" />
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>
    </>
  );
};

export default AdminDashboard;
