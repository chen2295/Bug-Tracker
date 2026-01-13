import { useState, FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// 1. ADD THIS INTERFACE AT THE TOP (Outside the function)
interface LoginResponse {
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
    team_id: number | null; // This tells TypeScript team_id can be a number OR null
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
      // 2. REPLACE YOUR OLD AXIOS LINE WITH THIS TYPED VERSION
      const res = await axios.post<LoginResponse>(
        "http://localhost:3001/login",
        {
          email,
          password,
        }
      );

      console.log("Logged in!", res.data.user);

      // Now this line will work perfectly (no red squiggly!)
      if (res.data.message === "Login Successful") {
        localStorage.setItem("user", JSON.stringify(res.data.user));

        if (res.data.user.team_id === null) {
          navigate("/onboarding");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Invalid email or password");
    }

    return (
      // ... (Your JSX HTML code remains exactly the same)
      <div className="container">{/* ... form inputs ... */}</div>
    );
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
