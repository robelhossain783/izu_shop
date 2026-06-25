"use client";

import { useState } from "react";
import { useAuth } from "../auth-context";
import Header from "../_components/Header";
import Footer from "../_components/Footer";

function Spinner() {
  return <span style={{ display: "inline-block", width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "izuSpin 0.6s linear infinite" }} />;
}

function AuthForm() {
  const { user, login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [emailPhone, setEmailPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  if (user) {
    return (
      <>
        <Header />
        <div style={{ maxWidth: 420, margin: "0 auto", padding: "80px 16px", textAlign: "center" }}>
          <div style={{ width: 68, height: 68, borderRadius: 16, background: "#e8320a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#222831", marginBottom: 8 }}>Welcome back, {user.first_name || user.username}!</h2>
          <p style={{ color: "#252a34", marginBottom: 28, fontSize: 14 }}>You are already logged in.</p>
          <a href="/izu_shop" style={{ display: "inline-block", background: "#e8320a", color: "#fff", padding: "12px 36px", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 14 }}>Continue Shopping</a>
        </div>
        <Footer />
      </>
    );
  }

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) { setError("Username and password are required"); return; }
    if (!isLogin && password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (!isLogin && password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    const result = isLogin
      ? await login(username, password)
      : await register({
          username,
          password,
          first_name: fullName.split(" ")[0] || username,
          last_name: fullName.split(" ").slice(1).join(" ") || "",
          email: emailPhone.includes("@") ? emailPhone : "",
        });
    setLoading(false);
    if (!result.success) setError(result.error || "Something went wrong");
  }

  return (
    <>
      <Header />
      <div style={{ background: "#FBF9F5", padding: "48px 16px 64px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div className="gb-auth-container">
            <div className="gb-auth-header">
              <div className="gb-auth-logo">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </div>
              <div className="gb-auth-header-info">
                <h1 className="gb-auth-title">{isLogin ? "Signin" : "Create New Account"}</h1>
                <p className="gb-auth-subtitle">{isLogin ? "Access your account securely" : "Register to get started"}</p>
              </div>
            </div>

            <div className="gb-auth-forms">
              {/* Mobile Login Section */}
              <div className="gb-login-section gb-mobile-login">
                <h3 className="gb-section-title">{isLogin ? "Login With Mobile Number" : "Signup With Mobile Number"}</h3>
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="gb-form-group">
                    <div className="gb-input-wrapper">
                      <span className="gb-input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e8320a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
                      </span>
                      <input type="text" className="gb-form-input" placeholder="01*********" />
                    </div>
                  </div>
                  <button type="submit" className="gb-primary-button" style={{ background: "#e8320a", color: "#fff" }}>
                    Send OTP
                  </button>
                </form>
              </div>

              {/* OR Divider */}
              <div className="gb-forms-divider">
                <div className="gb-forms-divider-text">OR</div>
              </div>

              {/* Credentials Section */}
              <div className="gb-login-section gb-credential-login">
                <h3 className="gb-section-title">{isLogin ? "Login With Credentials" : "Register a new account"}</h3>
                <form onSubmit={handleCredentialsSubmit}>
                  {!isLogin && (
                    <div className="gb-form-group">
                      <div className="gb-input-wrapper">
                        <span className="gb-input-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e8320a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </span>
                        <input type="text" className="gb-form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" />
                      </div>
                    </div>
                  )}
                  <div className="gb-form-group">
                    <div className="gb-input-wrapper">
                      <span className="gb-input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e8320a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                      </span>
                      <input type="text" className="gb-form-input" value={isLogin ? username : emailPhone} onChange={(e) => { isLogin ? setUsername(e.target.value) : setEmailPhone(e.target.value); }} placeholder={isLogin ? "Email or phone number" : "Email or Phone Number"} required />
                    </div>
                  </div>
                  <div className="gb-form-group">
                    <div className="gb-input-wrapper">
                      <span className="gb-input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e8320a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                      </span>
                      <input type={showPwd ? "text" : "password"} className="gb-form-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
                      <span className="gb-password-toggle" onClick={() => setShowPwd(!showPwd)}>
                        {showPwd ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        )}
                      </span>
                    </div>
                  </div>
                  {!isLogin && (
                    <div className="gb-form-group">
                      <div className="gb-input-wrapper">
                        <span className="gb-input-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e8320a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        </span>
                        <input type="password" className="gb-form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" />
                      </div>
                    </div>
                  )}
                  {!isLogin && (
                    <div className="gb-form-group">
                      <div className="gb-input-wrapper">
                        <span className="gb-input-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e8320a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        </span>
                        <input type="text" className="gb-form-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
                      </div>
                    </div>
                  )}
                  {isLogin && (
                    <div className="gb-auth-card-info">
                      <label className="gb-form-check">
                        <input type="checkbox" defaultChecked />
                        <span>Remember me</span>
                      </label>
                      <button type="button" className="gb-forgot-link">Forgotten password?</button>
                    </div>
                  )}
                  {error && <div className="gb-error">{error}</div>}
                  <button type="submit" disabled={loading} className="gb-primary-button" style={{ background: loading ? "#ccc" : "#e8320a", color: "#fff" }}>
                    {loading ? <Spinner /> : isLogin ? "Login" : "Register account"}
                  </button>
                </form>
              </div>
            </div>

            <div className="gb-divider">
              <span>{isLogin ? "or signin with" : "or signup with"}</span>
            </div>

            <div className="gb-social-login">
              <button type="button" className="gb-social-button" style={{ background: "#fff", cursor: "pointer", border: "1px solid transparent", boxShadow: "0px 2px 2px 0px rgba(32, 38, 46, 0.08)", borderRadius: "100%", width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              </button>
            </div>

            <div className="gb-auth-footer">
              {isLogin ? "Don't have any account?" : "Already have an account?"}{" "}
              <button onClick={() => { setIsLogin(!isLogin); setError(""); setPassword(""); setConfirmPassword(""); setUsername(""); setFullName(""); setEmailPhone(""); }}
                style={{ background: "none", border: "none", color: "#e8320a", textDecoration: "underline", fontWeight: 500, cursor: "pointer", fontSize: "inherit", padding: 0 }}>
                {isLogin ? "Register account" : "Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes izuSpin {
          to { transform: rotate(360deg); }
        }

        .gb-auth-container {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          padding: 40px;
          width: 100%;
        }

        .gb-auth-header {
          text-align: center;
          margin-bottom: 40px;
          display: flex;
          justify-content: center;
          gap: 16px;
          align-items: center;
        }

        .gb-auth-logo {
          width: 68px;
          height: 68px;
          background: #e8320a;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .gb-auth-header-info {
          text-align: left;
        }

        .gb-auth-title {
          font-size: 24px;
          font-weight: 700;
          color: #222831;
          margin: 0 0 6px;
          line-height: 120%;
        }

        .gb-auth-subtitle {
          color: #252a34;
          font-size: 15px;
          margin: 0;
          line-height: 120%;
        }

        .gb-auth-forms {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 32px;
          margin-bottom: 32px;
        }

        .gb-login-section {
          padding: 30px;
          border-radius: 15px;
          background: #F5F5F5;
        }

        .gb-section-title {
          font-size: 16px;
          font-weight: 600;
          color: #222831;
          margin: 0 0 16px;
        }

        .gb-form-group {
          margin-bottom: 16px;
        }

        .gb-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .gb-input-icon {
          position: absolute;
          left: 15px;
          color: #e8320a;
          font-size: 18px;
          z-index: 2;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
        }

        .gb-form-input {
          width: 100%;
          padding: 15px 20px 15px 44px;
          border-radius: 8px;
          font-size: 15px;
          transition: all 0.3s ease;
          background: #fff;
          border: 1px solid transparent;
          box-shadow: 0px 2px 2px 0px rgba(32,38,46,0.08);
          color: #222831;
          height: 52px;
          box-sizing: border-box;
        }

        .gb-form-input:focus {
          outline: none;
          border-color: #e8320a;
        }

        .gb-form-input::placeholder {
          color: #bdc3c7;
        }

        .gb-password-toggle {
          position: absolute;
          right: 15px;
          color: #9CA3AF;
          font-size: 16px;
          cursor: pointer;
          z-index: 2;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
        }

        .gb-password-toggle:hover {
          color: #e8320a;
        }

        .gb-primary-button {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .gb-primary-button:hover:not(:disabled) {
          background: #041f1e !important;
        }

        .gb-forms-divider {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 300px;
          position: relative;
        }

        .gb-forms-divider::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 2px;
          background: linear-gradient(to bottom, transparent, #ecf0f1, transparent);
          transform: translateX(-50%);
        }

        .gb-forms-divider-text {
          background: #fff;
          padding: 15px;
          border-radius: 50%;
          color: #999;
          font-weight: 600;
          font-size: 14px;
          border: 2px solid #ecf0f1;
          z-index: 2;
          position: relative;
          width: 56px;
          height: 56px;
          min-width: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }

        .gb-auth-card-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .gb-form-check {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #252a34;
        }

        .gb-form-check input[type="checkbox"] {
          accent-color: #e8320a;
          width: 16px;
          height: 16px;
        }

        .gb-forgot-link {
          background: none;
          border: none;
          color: #e8320a;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
        }

        .gb-forgot-link:hover {
          text-decoration: underline;
        }

        .gb-error {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
          margin-bottom: 16px;
        }

        .gb-divider {
          text-align: center;
          margin: 12px 0;
          position: relative;
          font-size: 14px;
        }

        .gb-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          right: 0;
          height: 1px;
          background: #eee;
          z-index: 1;
          width: 55%;
          transform: translateX(-50%);
        }

        .gb-divider span {
          background: #fff;
          padding: 0 15px;
          position: relative;
          z-index: 2;
          color: #252a34;
        }

        .gb-social-login {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-bottom: 12px;
        }

        .gb-social-button {
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .gb-social-button:hover {
          transform: translateY(-2px);
        }

        .gb-auth-footer {
          text-align: center;
          color: #252a34;
          display: flex;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .gb-auth-forms {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .gb-forms-divider {
            width: 100%;
            min-height: unset;
            flex-direction: row;
          }
          .gb-forms-divider::before {
            top: 50%;
            left: 0;
            height: 2px;
            width: 100%;
            transform: translateY(-50%);
          }
          .gb-forms-divider-text {
            width: 48px;
            height: 48px;
            min-width: 48px;
            font-size: 12px;
            padding: 0;
          }
          .gb-auth-container {
            padding: 24px;
          }
          .gb-auth-title {
            font-size: 18px;
          }
          .gb-auth-logo {
            width: 60px;
            height: 60px;
          }
          .gb-auth-header {
            gap: 12px;
            margin-bottom: 24px;
          }
          .gb-form-input {
            height: 44px;
            padding: 12px 16px 12px 40px;
            font-size: 14px;
          }
          .gb-primary-button {
            height: 44px;
            font-size: 13px;
          }
          .gb-login-section {
            padding: 24px;
          }
          .gb-auth-forms {
            margin-bottom: 24px;
          }
        }

        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #fff inset !important;
          -webkit-text-fill-color: #222831 !important;
        }
      `}</style>
      <Footer />
    </>
  );
}

export default function AuthPage() {
  return <AuthForm />;

}
