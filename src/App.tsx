import React, { useState, useEffect } from "react";
import SpacemanGame from "./components/SpacemanGame";
import LoginScreen from "./components/LoginScreen";
import { useAuth } from "./hooks/useAuth";

function App() {
  const { user, login, logout } = useAuth();
  const [balance, setBalance] = useState(1000); // Starting balance

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleBalanceUpdate = (newBalance: number) => {
    setBalance(newBalance);
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="w-full h-screen">
      <SpacemanGame
        userId={user.id}
        userName={user.user_metadata?.display_name || user.email || "Player"}
        balance={balance}
        onBalanceUpdate={handleBalanceUpdate}
      />
    </div>
  );
}

export default App;
