"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiCallManager } from "@/_api_/apiCallManager";
import { getToken } from "@/app/utils/auth";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import "./page.css"; // <--- IMPORT THE CSS FILE HERE

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Already logged in → redirect based on role
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (
        payload.is_system_admin === true ||
        payload.role === "SYSTEM_ADMIN" ||
        payload.role === "SUPER_ADMIN"
      ) {
        router.push("/system-admin/home");
      } else {
        router.push("/");
      }
    } catch {}
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Basic validation
    if (!email || !password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    try {
      // REAL API call to IMS backend auth
      const response = await apiCallManager.login({
        email,
        password,
      });

      if (response && response.token) {
        const token = response.token.access_token || response.token;
        const user = response.data;
        const role = user.role || "IMS_STAFF";

        // Always localStorage — works across all tabs
        localStorage.setItem("accessToken", token);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userRole", role);

        // Role-based redirect logic
        if (user.is_system_admin === true) {
          router.push("/system-admin/home");
        } else {
          router.push("/");
        }
      } else {
        setError("Invalid credentials or unexpected response");
      }
    } catch (err: unknown) {
      console.error("Login error:", err);
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e?.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="signin-container">
        <div className="signin-left">
          <div className="signin-left-content">
            <div className="signin-logo">🦷</div>
            <h1 className="signin-title">Dentistry99</h1>
            <p className="signin-subtitle">Your complete dental practice management solution</p>
          </div>
        </div>

        <div className="signin-right">
          <div className="signin-form-container">
            <h2 className="signin-form-title">Sign In</h2>
            <p className="signin-form-subtitle">Welcome back! Please sign in to your account.</p>

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

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="form-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((show) => !show)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeSlashIcon aria-hidden="true" />
                    ) : (
                      <EyeIcon aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className="form-checkbox-group">
                <input
                  type="checkbox"
                  id="remember"
                  className="form-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <label htmlFor="remember" className="form-checkbox-label">Remember me</label>
                <Link href="/forgot-password" className="form-forgot-password">
                  Forgot password?
                </Link>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="signin-button" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="signup-link">
              Don&apos;t have an account? <Link href="/signup">Sign up</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}