import { useState, FormEvent } from "react"; // Added Type for Form Events
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Define the shape of the API Response
interface LoginResponse {
  status: string;
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
  error?: string;
}

function Login() {
  // We tell TypeScript these states are strings
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  // Type the event 'e' as a Form Submission event
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // We tell axios: "Expect the response to look like LoginResponse"
      const res = await axios.post<LoginResponse>(
        "http://localhost:3001/login",
        { email, password }
      );

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        navigate("/dashboard");
      }
    } catch (err: any) {
      // Error handling in TS can be tricky, casting to 'any' is okay for now
      setError(err.response?.data?.error || "Login Failed");
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
