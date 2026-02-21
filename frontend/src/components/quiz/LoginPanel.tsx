import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, ArrowLeft } from "lucide-react";

interface LoginPanelProps {
  onLogin: (name: string) => void;
  role: "host" | "participant";
  homePath?: string; // configurable home/back path
}

const LoginPanel = ({ onLogin, role, homePath = "/" }: LoginPanelProps) => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState(""); // no default password
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Name cannot be empty");
      return;
    }

    if (role === "host") {
      const trimmedPassword = password.trim();
      if (!trimmedPassword || trimmedPassword.length < 3) {
        setError("Password must be at least 3 characters");
        return;
      }
      // TODO: Integrate secure password verification with backend
    }

    setError("");
    onLogin(trimmedName);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <button
          onClick={() => navigate(homePath)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <span className="text-3xl font-display font-bold text-primary-foreground">Q</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {role === "host" ? "Host Dashboard" : "Join Quiz"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {role === "host"
              ? "Sign in to manage your quiz"
              : "Enter your name to participate"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow-elevated p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              {role === "host" ? "Admin Name" : "Your Name"}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              placeholder={role === "host" ? "Enter admin name..." : "Enter your name..."}
              required
              maxLength={50}
              aria-invalid={!!error}
            />
          </div>

          {role === "host" && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                placeholder="Enter password..."
                required
                minLength={3}
                maxLength={50}
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <LogIn className="w-4 h-4" />
            {role === "host" ? "Sign In" : "Join"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPanel;
