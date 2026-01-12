import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Onboarding() {
  // State to toggle between "Create" and "Join" view
  const [mode, setMode] = useState<"create" | "join">("create");

  // Form Inputs
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // 1. Get the current logged-in user from LocalStorage
  // We use 'any' here to avoid complex type errors for now
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  // Safety Check: If no user is logged in, send them back to login
  if (!user) {
    navigate("/login");
    return null;
  }

  // --- LOGIC: CREATE TEAM ---
  const handleCreate = async () => {
    if (!teamName) {
      setError("Please enter a team name");
      return;
    }

    // A. Frontend generates the random 6-character code
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      // B. Send to Backend
      await axios.post("http://localhost:3001/teams/create", {
        name: teamName,
        join_code: newCode,
        user_id: user.id,
      });

      // C. Success!
      alert(`Team Created! Your Invite Code is: ${newCode}`);

      // D. Send to login so they can re-login and get their new team_id
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError("Failed to create team.");
    }
  };

  // --- LOGIC: JOIN TEAM ---
  const handleJoin = async () => {
    if (!joinCode) {
      setError("Please enter a code");
      return;
    }

    try {
      await axios.post("http://localhost:3001/teams/join", {
        join_code: joinCode,
        user_id: user.id,
      });

      alert("Joined successfully!");
      navigate("/login"); // Re-login to refresh data
    } catch (err) {
      setError("Invalid Code! Please ask your team for the correct code.");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-5 shadow-lg" style={{ width: "500px" }}>
        <h2 className="text-center mb-4">Welcome, {user.username}!</h2>
        <p className="text-center text-muted mb-4">
          You are not part of a team yet. Please choose an option below to get
          started.
        </p>

        {/* Toggle Buttons */}
        <div className="btn-group w-100 mb-4">
          <button
            className={`btn ${
              mode === "create" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => {
              setMode("create");
              setError("");
            }}
          >
            Create New Team
          </button>
          <button
            className={`btn ${
              mode === "join" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => {
              setMode("join");
              setError("");
            }}
          >
            Join Existing Team
          </button>
        </div>

        {/* Error Message Display */}
        {error && <div className="alert alert-danger">{error}</div>}

        {/* --- VIEW: CREATE TEAM --- */}
        {mode === "create" ? (
          <div>
            <div className="mb-3">
              <label className="form-label">Team Name</label>
              <input
                className="form-control"
                placeholder="e.g. Mobile App Squad"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
            <button className="btn btn-success w-100" onClick={handleCreate}>
              Create & Generate Code
            </button>
          </div>
        ) : (
          /* --- VIEW: JOIN TEAM --- */
          <div>
            <div className="mb-3">
              <label className="form-label">Enter Invite Code</label>
              <input
                className="form-control"
                placeholder="e.g. X7Y2Z1"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
            </div>
            <button className="btn btn-success w-100" onClick={handleJoin}>
              Join Team
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Onboarding;
