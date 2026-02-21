// /components/quiz/mocks/LoginPanel.tsx

import { useState } from "react";

interface LoginPanelProps {
  onLogin: (name: string) => void;
  role: "host" | "participant";
}

const LoginPanel = ({
  onLogin,
  role,
}: LoginPanelProps) => {

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const submit = () => {
    const trimmed = name.trim();

    if (!trimmed) return;

    if (role === "host") {
      if (!password || password.trim().length < 3) {
        return;
      }
    }

    onLogin(trimmed);
  };

  return (
    <div data-testid="mock-login-panel">

      <div data-testid="login-role">
        {role}
      </div>

      <input
        data-testid="login-name-input"
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
      />

      {role === "host" && (
        <input
          data-testid="login-password-input"
          type="password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />
      )}

      <button
        data-testid="login-submit"
        onClick={submit}
      >
        Submit
      </button>

      <button
        data-testid="login-submit-invalid"
        onClick={() =>
          onLogin("")
        }
      >
        Submit Invalid
      </button>

      <div data-testid="login-preview">
        {JSON.stringify({
          name,
          password,
          role,
        })}
      </div>

    </div>
  );
};

export default LoginPanel;
