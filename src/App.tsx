import React, { useState, useEffect } from "react";
import SpacemanGame from "./components/SpacemanGame";
import { LoginScreen } from "./components/LoginScreen";
import { useAuth } from "./hooks/useAuth";

function App() {
  const { user, profile, loading } = useAuth();
  const [demoUser, setDemoUser] = useState(null);
  const [balance, setBalance] = useState(1000); // Starting balance

  const handleLogin = (userProfile: any) => {
    // LoginScreen will handle Supabase authentication automatically
    console.log("User logged in:", userProfile);
  };

  const handleDemoMode = () => {
    // Create a demo user
    const demoUserData = {
      id: "demo-user",
      name: "Demo Player",
      email: "demo@example.com",
      avatar: "https://ui-avatars.com/api/?name=Demo+Player&background=random",
      isDemo: true,
      balance: 10000, // Demo balance
    };
    console.log("Demo mode activated:", demoUserData);
    setDemoUser(demoUserData);
    setBalance(10000);
  };

  const currentUser = demoUser || user;

  const handleBalanceUpdate = (newBalance: number) => {
    setBalance(newBalance);
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} onDemoMode={handleDemoMode} />;
  }

  return (
    <div className="w-full h-screen">
      <SpacemanGame
        userId={currentUser.id}
        userName={
          currentUser.name ||
          currentUser.user_metadata?.display_name ||
          currentUser.email ||
          "Player"
        }
        balance={balance}
        onBalanceUpdate={handleBalanceUpdate}
      />
    </div>
  );
}

export default App;
