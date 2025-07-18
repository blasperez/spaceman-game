import React, { useState, useEffect } from "react";
import SpacemanGame from "./components/SpacemanGame";
import { LoginScreen } from "./components/LoginScreen";
import { useAuth } from "./hooks/useAuth";

function App() {
  const { user, login, logout } = useAuth();
  const [balance, setBalance] = useState(1000); // Starting balance

  const handleLogin = (userProfile: any) => {
    // LoginScreen will handle the authentication and pass the user profile
    console.log("User logged in:", userProfile);
  };

  const handleDemoMode = () => {
    // Create a demo user
    const demoUser = {
      id: "demo-user",
      name: "Demo Player",
      email: "demo@example.com",
      avatar: "https://ui-avatars.com/api/?name=Demo+Player&background=random",
      isDemo: true,
      balance: 10000, // Demo balance
    };
    console.log("Demo mode activated:", demoUser);
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
