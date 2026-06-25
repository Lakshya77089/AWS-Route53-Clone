"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push("/");
  }, [user, loading, router]);

  if (loading || user) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      router.push("/");
    } catch {
      setError("Invalid username or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center pt-16"
      style={{ backgroundColor: "var(--aws-bg)" }}
    >
      {/* AWS Logo */}
      <div className="flex items-center gap-2 mb-6">
        <svg viewBox="0 0 24 24" className="w-8 h-8" aria-hidden>
          <path
            d="M5 13.5c1 2 3.5 3 6.8 3 4.6 0 8.2-1.7 8.2-1.7"
            fill="none"
            stroke="#ff9900"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path d="M19 14.3l1.6.9-.9 1.6" fill="none" stroke="#ff9900" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-2xl font-bold" style={{ color: "var(--aws-text)" }}>
          aws
        </span>
      </div>

      <div
        className="w-full max-w-sm rounded border p-8"
        style={{ backgroundColor: "var(--aws-card)", borderColor: "var(--aws-border)" }}
      >
        <h1 className="text-xl font-normal mb-5" style={{ color: "var(--aws-text)" }}>
          Sign in
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded focus:outline-none"
              style={{ borderColor: "var(--aws-border)" }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded focus:outline-none"
              style={{ borderColor: "var(--aws-border)" }}
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: "var(--aws-red)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-1.5 text-sm font-semibold text-white rounded transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--aws-primary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--aws-primary-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--aws-primary)")}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>

      <p
        className="text-xs mt-4"
        style={{ color: "var(--aws-text-secondary)" }}
      >
        Default credentials: admin / admin
      </p>
    </div>
  );
}
