"use client";

import { useState } from "react";
import Link from "next/link";
import { apiCallManager } from "@/_api_/apiCallManager";
import "../login/page.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      await apiCallManager.forgotPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-left">
        <div className="signin-left-content">
          <div className="signin-logo">&#x1F9B7;</div>
          <h1 className="signin-title">Dentistry99</h1>
          <p className="signin-subtitle">Your complete dental practice management solution</p>
        </div>
      </div>

      <div className="signin-right">
        <div className="signin-form-container">
          <h2 className="signin-form-title">Forgot Password</h2>
          <p className="signin-form-subtitle">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          {success ? (
            <div>
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem',
                padding: '1rem', marginBottom: '1.5rem', color: '#166534',
              }}>
                Check your email for a password reset link.
              </div>
              <Link href="/login" className="signin-button" style={{
                display: 'block', textAlign: 'center', textDecoration: 'none',
              }}>
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address</label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="signin-button" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>

              <div className="signup-link">
                <Link href="/login">Back to Sign In</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
