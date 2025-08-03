import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/users/register", { name, email, password });
      login(res.data); // auto-login
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <form className="p-4 border rounded bg-light" onSubmit={handleSubmit}>
        <h2 className="mb-3 text-center">Register</h2>
        <input className="form-control mb-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="form-control mb-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" className="form-control mb-3" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="btn btn-success w-100" type="submit">Register</button>
        <p className="mt-2 text-center">Already have an account? <Link to="/">Login</Link></p>
      </form>
    </div>
  );
}
