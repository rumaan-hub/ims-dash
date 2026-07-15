"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiCallManager } from "@/_api_/apiCallManager";
import "../login/page.css";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await apiCallManager.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Invalid or expired reset token.";
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
          <h2 className="signin-form-title">Reset Password</h2>
          <p className="signin-form-subtitle">Enter your new password below.</p>

          {success ? (
            <div>
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem',
                padding: '1rem', marginBottom: '1.5rem', color: '#166534',
              }}>
                Password reset successfully! Redirecting to login...
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="newPassword" className="form-label">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  className="form-input"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="form-input"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="signin-button" disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset Password"}
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

export default function ResetPassword() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
