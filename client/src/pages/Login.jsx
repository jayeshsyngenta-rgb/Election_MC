import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, User, Lock, Users, ShieldCheck, TrendingUp } from "lucide-react";
import "./login-additions.css";
import chiefPhoto from "../assets/cm.jpg";

const ADMIN_USERNAME = "MLC2026@MC";
const ADMIN_PASSWORD = "MC@MLC2026";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem("voterToken", "authenticated");
      localStorage.setItem("voterUsername", username);
      navigate("/voter-search");
    } else {
      setError("Invalid username or password");
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="hero-photo-wrap">
          <img src={chiefPhoto} alt="Shri Mangesh Chivate" className="hero-photo" />
          <div className="hero-photo-fade" />
        </div>

        <div className="hero-right">
          <div className="hero-heading">
            <h1 className="hero-name">श्री. मंगेश चिवटे.</h1>
            <p className="hero-sub">उमेदवार – पुणे विभाग</p>
            <p className="hero-sub">
              शिक्षक मतदारसंघ निवडणूक <span className="hero-year">2026</span>.
            </p>
          </div>

          <section className="login-card">
            <h2 className="login-card-title">
              <Users size={22} />
              मतदार शोध प्रणाली
            </h2>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="field-icon">
                <User size={18} className="field-icon-svg" />
                <input
                  type="text"
                  placeholder="वापरकर्ता नाव"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="field-icon">
                <Lock size={18} className="field-icon-svg" />
                <input
                  type="password"
                  placeholder="संकेतशब्द"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="login-error">{error}</p>}

              <button className="btn-login" type="submit" disabled={loading}>
                <LogIn size={18} />
                {loading ? "Signing in..." : "लॉगिन"}
              </button>

              <a href="#" className="forgot-link">संकेतशब्द विसरलात?</a>
            </form>
          </section>
        </div>
      </div>

      {/* Bottom wave bar */}
      <div className="login-footer">
        <div className="footer-icons">
          <div className="footer-icon-item">
            <span className="footer-icon-circle"><Users size={20} /></span>
            <span>पारदर्शकता</span>
          </div>
          <div className="footer-icon-item">
            <span className="footer-icon-circle"><ShieldCheck size={20} /></span>
            <span>विश्वसनीयता</span>
          </div>
          <div className="footer-icon-item">
            <span className="footer-icon-circle"><TrendingUp size={20} /></span>
            <span>उत्तरदायित्व</span>
          </div>
        </div>

        <div className="footer-quote">
          <span className="quote-mark quote-mark-left">"</span>
          शिक्षकांचा सन्मान, शिक्षणाचा विकास<br />
          सशक्त शिक्षक, सशक्त महाराष्ट्र
          <span className="quote-mark quote-mark-right">"</span>
        </div>
      </div>
    </div>
  );
}