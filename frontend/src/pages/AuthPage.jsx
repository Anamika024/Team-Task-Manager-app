import { Layers } from "lucide-react";
import { Field } from "../components/ui";

export function AuthPage({ authMode, setAuthMode, authForm, setAuthForm, message, onSubmit }) {
  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="auth-copy">
          <div className="logo-mark"><Layers size={20} /></div>
          <p className="eyebrow">Taskflow</p>
          <h1>Team task manager for focused project work.</h1>
          <p>Sign in, create projects, invite teammates, and move tasks through a clean kanban workflow.</p>
        </div>
        <form onSubmit={onSubmit} className="auth-form">
          <div className="segmented">
            <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Login</button>
            <button type="button" className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")}>Signup</button>
          </div>
          {authMode === "signup" && <Field label="Name"><input value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} required /></Field>}
          <Field label="Email"><input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required /></Field>
          <Field label="Password"><input type="password" minLength="6" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required /></Field>
          {message && <p className="error">{message}</p>}
          <button className="btn btn-primary" type="submit">{authMode === "login" ? "Login" : "Create Account"}</button>
          <p className="auth-note">To test another member, logout first, signup with a new email, then login again with the admin account to add that member by email.</p>
        </form>
      </section>
    </main>
  );
}
