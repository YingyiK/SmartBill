import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Bell, Key, Save, Edit2, X, Check } from "lucide-react";
import authService from "../services/authService";

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [currentUser, setCurrentUser] = useState(null);

  // Profile state
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  
  // Username edit state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");

  // Password reset state
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Notification state
  const [expenseCreated, setExpenseCreated] = useState(true);
  const [expenseSplit, setExpenseSplit] = useState(true);
  const [paymentReceived, setPaymentReceived] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Get custom username from localStorage
  const getStoredUsername = () => {
    return localStorage.getItem('display_username');
  };

  // Save custom username to localStorage
  const saveUsername = (name) => {
    localStorage.setItem('display_username', name);
  };

  // Load user data
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setEmail(user.email || "");
      
      // Prefer custom username if available
      const storedUsername = getStoredUsername();
      const defaultUsername = user.username || user.email?.split("@")[0] || "";
      setUsername(storedUsername || defaultUsername);
    }
  }, []);

  // Handle username edit
  const handleEditUsername = () => {
    setEditedUsername(username);
    setIsEditingUsername(true);
    setUsernameError("");
  };

  // Handle save username
  const handleSaveUsername = () => {
    const trimmedUsername = editedUsername.trim();
    
    // Validation
    if (!trimmedUsername) {
      setUsernameError("Username cannot be empty");
      return;
    }

    if (trimmedUsername.length < 2) {
      setUsernameError("Username must be at least 2 characters");
      return;
    }

    if (trimmedUsername.length > 50) {
      setUsernameError("Username must be less than 50 characters");
      return;
    }

    // Save username to localStorage
    saveUsername(trimmedUsername);
    setUsername(trimmedUsername);
    setIsEditingUsername(false);
    setUsernameError("");
  };

  // Handle cancel edit
  const handleCancelEditUsername = () => {
    setIsEditingUsername(false);
    setEditedUsername("");
    setUsernameError("");
  };

  // Handle password reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    try {
      // TODO: Call API to reset password
      // await authAPI.resetPassword(currentPassword, newPassword);
      
      setPasswordSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordReset(false);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch (err) {
      setPasswordError(err.message || "Failed to update password");
    }
  };

  // Handle save notifications
  const handleSaveNotifications = () => {
    // TODO: Save notification preferences to backend
    alert("Notification preferences saved!");
  };

  // Reusable Toggle Switch Component
  const ToggleSwitch = ({ checked, onChange, label, description }) => (
    <div className="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition">
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {description && (
          <div className="text-xs text-gray-500 mt-1">{description}</div>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer ml-4">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );

  // Render Profile Tab
  const renderProfile = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold border-b pb-2 mb-4 text-gray-800">
        User Profile
      </h3>

      {/* User Info Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl font-bold flex items-center justify-center shadow-lg">
            {username?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1">
            <h4 className="text-2xl font-bold text-gray-900">{username}</h4>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Mail size={14} />
              {email}
            </p>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Account Details
        </h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
              <Mail size={18} className="text-gray-400" />
              <span>{email}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed
            </p>
          </div>

          {/* Editable Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            
            {!isEditingUsername ? (
              // Display mode
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                  <User size={18} className="text-gray-400" />
                  <span>{username}</span>
                </div>
                <button
                  onClick={handleEditUsername}
                  className="p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Edit username"
                >
                  <Edit2 size={18} />
                </button>
              </div>
            ) : (
              // Edit mode
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedUsername}
                    onChange={(e) => setEditedUsername(e.target.value)}
                    placeholder="Enter display name"
                    autoFocus
                    className="flex-1 px-4 py-3 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSaveUsername();
                      if (e.key === 'Escape') handleCancelEditUsername();
                    }}
                  />
                  <button
                    onClick={handleSaveUsername}
                    className="p-3 bg-green-600 text-white hover:bg-green-700 rounded-lg transition"
                    title="Save"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={handleCancelEditUsername}
                    className="p-3 bg-gray-500 text-white hover:bg-gray-600 rounded-lg transition"
                    title="Cancel"
                  >
                    <X size={18} />
                  </button>
                </div>
                {usernameError && (
                  <p className="text-xs text-red-600">{usernameError}</p>
                )}
                <p className="text-xs text-gray-500">
                  This is how your name will appear throughout the app
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Success Message (outside password reset form) */}
      {passwordSuccess && !showPasswordReset && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg flex items-center gap-2">
          {passwordSuccess}
        </div>
      )}

      {/* Password Reset Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Key size={20} className="text-amber-600" />
              Password
            </h4>
            <p className="text-sm text-gray-500 mt-1">
              Change your account password
            </p>
          </div>
          {!showPasswordReset && (
            <button
              onClick={() => setShowPasswordReset(true)}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm font-medium"
            >
              Reset Password
            </button>
          )}
        </div>

        {showPasswordReset && (
          <form onSubmit={handlePasswordReset} className="space-y-4 mt-6 border-t pt-6">
            {passwordError && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {passwordError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordReset(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setPasswordError("");
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium"
              >
                Update Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  // Render Notifications Tab
  const renderNotifications = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold border-b pb-2 mb-4 text-gray-800">
        Notification Preferences
      </h3>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
        <div className="flex gap-2">
          <div className="text-xl"></div>
          <div>
            <p className="text-sm text-blue-900 font-medium">
              Manage your notification preferences
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Control what notifications you receive via email
            </p>
          </div>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Mail size={20} className="text-blue-600" />
          Email Notifications
        </h4>

        <ToggleSwitch
          label="Expense Created"
          description="Receive notifications when a new expense is created"
          checked={expenseCreated}
          onChange={() => setExpenseCreated(!expenseCreated)}
        />

        <ToggleSwitch
          label="Expense Split"
          description="Get notified when someone splits a bill with you"
          checked={expenseSplit}
          onChange={() => setExpenseSplit(!expenseSplit)}
        />

        <ToggleSwitch
          label="Payment Received"
          description="Receive notifications when someone marks a payment as complete"
          checked={paymentReceived}
          onChange={() => setPaymentReceived(!paymentReceived)}
        />

        <ToggleSwitch
          label="All Email Notifications"
          description="Master switch for all email notifications"
          checked={emailNotifications}
          onChange={() => setEmailNotifications(!emailNotifications)}
        />
      </div>

      {/* Save Button */}
      <div className="pt-6 border-t">
        <button
          onClick={handleSaveNotifications}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          <Save size={18} />
          Save Preferences
        </button>
      </div>
    </div>
  );

  return (
    <main className="p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-base text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 space-y-2 p-4 bg-white rounded-xl shadow-sm h-fit">
          <div
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              activeTab === "profile"
                ? "bg-blue-100 text-blue-700 font-semibold"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("profile")}
          >
            <User size={18} />
            Profile
          </div>
          <div
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              activeTab === "notifications"
                ? "bg-blue-100 text-blue-700 font-semibold"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("notifications")}
          >
            <Bell size={18} />
            Notifications
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "profile" && renderProfile()}
          {activeTab === "notifications" && renderNotifications()}
        </div>
      </div>
    </main>
  );
}