import { useState, FormEvent } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // --- 1. Validation Logic ---
  const validateInputs = () => {
    // A. Check Email (must look like email and include .com)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || !email.includes(".com")) {
      return "Email must be valid and end in .com";
    }

    // B. Check Password (8 chars, letters + numbers)
    // Regex: At least 1 letter, 1 number, 8+ characters
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      return "Password must be at least 8 chars long and contain both letters and numbers.";
    }

    return null; // No errors
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // --- 2. Run Validation ---
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return; // Stop here! Don't send data to server.
    }

    try {
      // Note: We REMOVED team_id from here because you want to do it later!
      await axios.post("http://localhost:3001/register", {
        username,
        email,
        password,
      });

      alert("Registration Successful! Please login.");
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data || "Registration Failed");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow-lg" style={{ width: "400px" }}>
        <h3 className="text-center mb-4">Sign Up</h3>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              className="form-control"
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="form-text">Min 8 chars, letters & numbers.</div>
          </div>
          {/* REMOVED TEAM SELECTOR */}
          <button type="submit" className="btn btn-success w-100">
            Register
          </button>
        </form>
        <p className="mt-3 text-center">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
