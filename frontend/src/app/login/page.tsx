"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Route } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--aws-bg)" }}>
      <div
        className="w-full max-w-sm rounded-lg border p-8 shadow-lg"
        style={{ backgroundColor: "var(--aws-card)", borderColor: "var(--aws-border)" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Route className="w-6 h-6" style={{ color: "var(--aws-primary)" }} />
          <span className="text-lg font-bold" style={{ color: "var(--aws-text)" }}>
            Route 53 Console
          </span>
        </div>

        <h2 className="text-center text-lg font-semibold mb-1">Sign In</h2>
        <p
          className="text-center text-xs mb-6"
          style={{ color: "var(--aws-text-secondary)" }}
        >
          Use your credentials to sign in
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded focus:outline-none"
              style={{ borderColor: "var(--aws-border)" }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Password</label>
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
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p
          className="text-center text-[10px] mt-4"
          style={{ color: "var(--aws-text-secondary)" }}
        >
          Default: admin / admin
        </p>
      </div>
    </div>
  );
}
