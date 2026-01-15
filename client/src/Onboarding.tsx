import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Onboarding() {
  const [view, setView] = useState<"create" | "join">("create");
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null; // --- CREATE TEAM ---

  const handleCreateTeam = async () => {
    if (!teamName || !user) return;
    try {
      // FIX: Changed from http://localhost:3001/... to relative path
      const res = await axios.post("/teams/create", {
        team_name: teamName,
        created_by: user.id,
      }); // Alert the user with the new JOIN CODE

      alert(`Team Created! Your Invite Code is: ${res.data.join_code}`);

      completeOnboarding(res.data.team_id);
    } catch (err) {
      setError("Failed to create team.");
    }
  }; // --- JOIN TEAM ---

  const handleJoinTeam = async () => {
    if (!joinCode || !user) return;
    try {
      // FIX: Changed from http://localhost:3001/... to relative path
      const res = await axios.post("/teams/join", {
        join_code: joinCode,
        user_id: user.id,
      });
      completeOnboarding(res.data.team_id);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setError("Invalid Join Code. Please check again.");
      } else {
        setError("Failed to join team.");
      }
    }
  };

  const completeOnboarding = (teamId: number) => {
    user.team_id = teamId;
    localStorage.setItem("user", JSON.stringify(user));
    navigate("/dashboard");
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
            
      <div
        className="card p-5 shadow-lg text-center"
        style={{ width: "500px" }}
      >
                <h2>Welcome, {user ? user.username : "User"}!</h2>
                <p className="text-muted">You are not part of a team yet.</p>
                {error && <div className="alert alert-danger">{error}</div>}
                
        <div className="btn-group w-100 mb-4">
                    
          <button
            className={`btn ${
              view === "create" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => {
              setView("create");
              setError("");
            }}
          >
                        Create New Team           
          </button>
                    
          <button
            className={`btn ${
              view === "join" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => {
              setView("join");
              setError("");
            }}
          >
                        Join Existing Team           
          </button>
                  
        </div>
                {/* CREATE VIEW */}
                
        {view === "create" && (
          <div>
                        
            <input
              type="text"
              className="form-control mb-3"
              placeholder="Enter Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
                        
            <button
              onClick={handleCreateTeam}
              className="btn btn-success w-100"
            >
                            Create & Generate Code             
            </button>
                      
          </div>
        )}
                {/* JOIN VIEW */}
                
        {view === "join" && (
          <div>
                        
            <input
              type="text"
              className="form-control mb-3"
              placeholder="Enter Join Code (e.g. A7X29)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
                        
            <button
              onClick={handleJoinTeam}
              className="btn btn-info w-100 text-white"
            >
                            Join Team             
            </button>
                      
          </div>
        )}
              
      </div>
          
    </div>
  );
}

export default Onboarding;
