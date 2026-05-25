"use client";

import { useEffect, useState } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";

const AUTH_KEY = "pm-authenticated";
const USERNAME = "user";
const PASSWORD = "password";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(AUTH_KEY);
    setIsAuthenticated(stored === "true");
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (username === USERNAME && password === PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "true");
      setIsAuthenticated(true);
      setError(null);
      return;
    }
    setError("Invalid credentials. Use user / password.");
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
    setError(null);
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[var(--surface)] px-6 py-16">
        <div className="mx-auto w-full max-w-md rounded-3xl border border-[var(--stroke)] bg-white/90 p-8 shadow-[var(--shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gray-text)]">
            Sign in
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-[var(--navy-dark)]">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-[var(--gray-text)]">
            Use the demo credentials to access your board.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-medium text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
                placeholder="user"
                autoComplete="username"
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-medium text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
                placeholder="password"
                autoComplete="current-password"
              />
            </label>
            {error ? (
              <p className="text-sm font-semibold text-[var(--secondary-purple)]" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              className="w-full rounded-full bg-[var(--secondary-purple)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:brightness-110"
            >
              Sign in
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="relative">
      <div className="absolute right-6 top-6 z-10">
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-[var(--stroke)] bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--navy-dark)] shadow-[var(--shadow)] transition hover:border-[var(--primary-blue)]"
        >
          Log out
        </button>
      </div>
      <KanbanBoard />
    </div>
  );
}
