import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/navbar";

const Homepage = () => {
  return (
    <>
      <Navbar userRole="user" />
      <div>
        This is the homepage
        <Link
          to="/super-admin-dashboard"
          className="block w-full h-full underline underline-offset-4"
        >
          Go to SAdmin Dashboard
        </Link>
        <Link
          to="/login"
          className="block w-full h-full underline underline-offset-4"
        >
          Go to Login
        </Link>
        <Link
          to="/admin-dashboard"
          className="block w-full h-full underline underline-offset-4"
        >
          Go to Admin Dashboard
        </Link>
      </div>
    </>
  );
};

export default Homepage;
