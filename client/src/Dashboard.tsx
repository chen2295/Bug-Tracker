import React from "react";
import { useNavigate } from "react-router-dom";

// We add ': React.FC' to tell TS this is a Functional Component
const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="container mt-5">
      <h1>Welcome to the Dashboard</h1>
      <p>You are successfully logged in!</p>
      <button onClick={handleLogout} className="btn btn-danger">
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
