import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, User, Lock, ArrowLeft } from "lucide-react";
import "./adminlogin.css";
import { api } from "../api";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api.adminLogin(username, password);
      localStorage.setItem("adminDashToken", data.token);
      localStorage.setItem("adminDashUsername", username);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-wrap">
        <section className="admin-login-card">
          <div className="admin-login-icon">
            <Lock size={22} />
          </div>

          <h1 className="admin-login-card-title">Admin login</h1>
          <p className="admin-login-card-desc">Sign in to manage voter records</p>

          <form onSubmit={handleSubmit} className="admin-login-form">
            <div>
              <label htmlFor="username">Username</label>
              <div className="admin-field-icon">
                <User size={16} className="admin-field-icon-svg" />
                <input
                  id="username"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password">Password</label>
              <div className="admin-field-icon">
                <Lock size={16} className="admin-field-icon-svg" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && <p className="admin-login-error">{error}</p>}

            <button className="admin-btn-login" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Log in"}
              <LogIn size={18} />
            </button>
          </form>

          {/* Change "/" to wherever the user/voter login page actually lives */}
          <Link to="/" className="admin-login-back">
            <ArrowLeft size={15} />
            Back to voter login
          </Link>

          <p className="admin-login-footer">Authorized personnel only</p>
        </section>
      </div>
    </div>
  );
}