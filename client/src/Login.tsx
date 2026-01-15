import { useState, FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// 1. UPDATED INTERFACE (Now includes token)
interface LoginResponse {
  message: string;
  token: string; // <--- Added this!
  user: {
    id: number;
    username: string;
    email: string;
    team_id: number | null;
  };
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // FIX: Changed absolute URL to relative URL for AWS deployment
      // Old: "http://localhost:3001/login" -> New: "/login"
      const res = await axios.post<LoginResponse>("/login", {
        email,
        password,
      });

      console.log("Logged in!", res.data.user); // 2. FIXED LOGIC: Check if user exists (safer than checking message string)

      if (res.data.user) {
        // Save BOTH the user data AND the token
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("token", res.data.token); // <--- CRITICAL FIX // Navigate based on team status

        if (res.data.user.team_id === null) {
          navigate("/onboarding");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err: any) {
      console.error(err); // specific error handling if available, otherwise generic
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Invalid email or password");
      }
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
            
      <div className="card p-4 shadow-lg" style={{ width: "400px" }}>
                <h3 className="text-center mb-4">Bug Tracker Login</h3>
                {error && <div className="alert alert-danger">{error}</div>}
                
        <form onSubmit={handleSubmit}>
                    
          <div className="mb-3">
                        <label className="form-label">Email</label>
                        
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
                      
          </div>
                    
          <div className="mb-3">
                        <label className="form-label">Password</label>
                        
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
                      
          </div>
                    
          <button type="submit" className="btn btn-primary w-100">
                        Login           
          </button>
                  
        </form>
                
        <p className="mt-3 text-center">
                    Don't have an account? <a href="/register">Sign Up</a>
                  
        </p>
              
      </div>
          
    </div>
  );
}

export default Login;
