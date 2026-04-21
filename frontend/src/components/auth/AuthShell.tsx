import type { FormEvent } from "react";
import type { AuthMode, ConnectionState } from "../../types/app";

interface AuthShellProps {
  authMode: AuthMode;
  connectionState: ConnectionState;
  busy: boolean;
  loginEmail: string;
  loginPassword: string;
  rememberMe: boolean;
  registerEmail: string;
  registerUsername: string;
  registerPassword: string;
  resetEmail: string;
  onSetAuthMode: (mode: AuthMode) => void;
  onSetLoginEmail: (v: string) => void;
  onSetLoginPassword: (v: string) => void;
  onSetRememberMe: (v: boolean) => void;
  onSetRegisterEmail: (v: string) => void;
  onSetRegisterUsername: (v: string) => void;
  onSetRegisterPassword: (v: string) => void;
  onSetResetEmail: (v: string) => void;
  onLoginSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onRegisterSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onResetSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export function AuthShell({
  authMode,
  connectionState,
  busy,
  loginEmail,
  loginPassword,
  rememberMe,
  registerEmail,
  registerUsername,
  registerPassword,
  resetEmail,
  onSetAuthMode,
  onSetLoginEmail,
  onSetLoginPassword,
  onSetRememberMe,
  onSetRegisterEmail,
  onSetRegisterUsername,
  onSetRegisterPassword,
  onSetResetEmail,
  onLoginSubmit,
  onRegisterSubmit,
  onResetSubmit,
}: AuthShellProps) {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="eyebrow">Meeting Minds</div>
        <h1>Bring every conversation into one calm place</h1>
        <p className="lede">
          Sign in to manage shared spaces, direct conversations, files, presence, and device
          sessions from one clean workspace.
        </p>

        <div className="auth-tabs">
          <button
            className={authMode === "login" ? "is-active" : ""}
            onClick={() => onSetAuthMode("login")}
          >
            Sign In
          </button>
          <button
            className={authMode === "register" ? "is-active" : ""}
            onClick={() => onSetAuthMode("register")}
          >
            Register
          </button>
        </div>

        {authMode === "login" ? (
          <form className="auth-form" onSubmit={onLoginSubmit}>
            <label>
              Email
              <input
                onChange={(e) => onSetLoginEmail(e.target.value)}
                required
                type="email"
                value={loginEmail}
              />
            </label>
            <label>
              Password
              <input
                onChange={(e) => onSetLoginPassword(e.target.value)}
                required
                type="password"
                value={loginPassword}
              />
            </label>
            <label className="checkbox-row">
              <input
                checked={rememberMe}
                onChange={(e) => onSetRememberMe(e.target.checked)}
                type="checkbox"
              />
              Keep this browser signed in
            </label>
            <button className="primary-button" disabled={busy} type="submit">
              {busy ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : null}

        {authMode === "register" ? (
          <form className="auth-form" onSubmit={onRegisterSubmit}>
            <label>
              Email
              <input
                onChange={(e) => onSetRegisterEmail(e.target.value)}
                required
                type="email"
                value={registerEmail}
              />
            </label>
            <label>
              Username
              <input
                onChange={(e) => onSetRegisterUsername(e.target.value)}
                required
                type="text"
                value={registerUsername}
              />
            </label>
            <label>
              Password
              <input
                onChange={(e) => onSetRegisterPassword(e.target.value)}
                required
                type="password"
                value={registerPassword}
              />
            </label>
            <button className="primary-button" disabled={busy} type="submit">
              {busy ? "Creating..." : "Create Account"}
            </button>
          </form>
        ) : null}

        <footer className="auth-footer">
          <span>Live link: {connectionState}</span>
          <span>Presence and unread counts stay in sync through the session socket.</span>
        </footer>
      </section>
    </main>
  );
}
