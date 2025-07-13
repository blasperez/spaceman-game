import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AccountPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountPanel: React.FC<AccountPanelProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Account Settings</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="border-b dark:border-gray-700">
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-4 border-b-2 ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-2 px-4 border-b-2 ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500'
                }`}
              >
                Settings
              </button>
            </nav>
          </div>

          {activeTab === 'profile' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <p className="text-gray-600 dark:text-gray-300">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">User ID</label>
                <p className="text-gray-600 dark:text-gray-300 text-xs font-mono">{user?.id}</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-3">
              <button
                onClick={signOut}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountPanel;