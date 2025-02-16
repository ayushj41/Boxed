import React, { useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { useSignIn, useSignUp, useAuth } from "@clerk/clerk-react";
import axios from "axios";

// Custom hook for MongoDB operations
const useMongoAuth = () => {
  const saveUserToMongo = async (userData) => {
    try {
      const response = await axios.post('/api/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error saving user to MongoDB:', error);
      throw error;
    }
  };

  return { saveUserToMongo };
};

const AuthPage = ({ setUsername }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [view, setView] = useState("login"); // login, signup, forgotPassword, resetCode, newPassword
  const [message, setMessage] = useState(null);

  const navigate = useNavigate();
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp } = useSignUp();
  const { signOut } = useAuth();
  const { saveUserToMongo } = useMongoAuth();

  const extractUsernameFromEmail = (email) => {
    return email.split('@')[0];
  };

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    try {
      await signOut();
      const result = await signIn.create({
        identifier: email.trim(),
        password: password.trim()
      });

      if (result.status === "complete") {
        await setSignInActive({ session: result.createdSessionId });
        const username = extractUsernameFromEmail(email);
        setUsername(username);
        localStorage.setItem("username", username);
        navigate(`/${username}/dashboard`);
      }
    } catch (error) {
      setMessage({ type: "error", text: "Invalid email or password" });
    }
  };

  // Handle Sign Up
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords don't match" });
      return;
    }

    try {
      const signUpAttempt = await signUp.create({
        emailAddress: email.trim(),
        password: password.trim()
      });

      if (signUpAttempt.status === "complete") {
        // Save user to MongoDB
        await saveUserToMongo({
          email: email.trim(),
          username: extractUsernameFromEmail(email)
        });

        const username = extractUsernameFromEmail(email);
        setUsername(username);
        localStorage.setItem("username", username);
        navigate(`/${username}/dashboard`);
      }
    } catch (error) {
      setMessage({ type: "error", text: error.errors?.[0]?.message || "Error creating account" });
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      setView("resetCode");
      setMessage({ type: "info", text: "Reset code sent to your email" });
    } catch (error) {
      setMessage({ type: "error", text: "Error sending reset code" });
    }
  };

  // Handle Reset Code Verification
  const handleResetCode = async (e) => {
    e.preventDefault();
    if (!resetCode.trim()) return;

    try {
      await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode.trim(),
      });
      setView("newPassword");
    } catch (error) {
      setMessage({ type: "error", text: "Invalid reset code" });
    }
  };

  // Handle Password Reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!password.trim() || password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords don't match" });
      return;
    }

    try {
      await signIn.resetPassword({
        password: password.trim(),
      });
      setMessage({ type: "success", text: "Password reset successful" });
      setView("login");
    } catch (error) {
      setMessage({ type: "error", text: "Error resetting password" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        {message && (
          <p className={`text-center mb-4 ${
            message.type === "error" ? "text-red-500" : 
            message.type === "info" ? "text-blue-500" : 
            "text-green-500"}`}
          >
            {message.text}
          </p>
        )}

        {view === "login" && (
          <form onSubmit={handleLogin}>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Log in</h2>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address or phone number"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors mb-4"
            >
              Log in
            </button>
            <p 
              className="text-center text-blue-500 hover:underline cursor-pointer mb-4"
              onClick={() => setView("forgotPassword")}
            >
              Forgotten password?
            </p>
            <hr className="mb-4" />
            <button
              type="button"
              onClick={() => setView("signup")}
              className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Create new account
            </button>
          </form>
        )}

        {view === "signup" && (
          <form onSubmit={handleSignUp}>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Sign Up</h2>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors mb-4"
            >
              Sign Up
            </button>
            <p 
              className="text-center text-blue-500 hover:underline cursor-pointer"
              onClick={() => setView("login")}
            >
              Already have an account?
            </p>
          </form>
        )}

        {view === "forgotPassword" && (
          <form onSubmit={handleForgotPassword}>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Reset Password</h2>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors mb-4"
            >
              Send Reset Code
            </button>
            <p 
              className="text-center text-blue-500 hover:underline cursor-pointer"
              onClick={() => setView("login")}
            >
              Back to Login
            </p>
          </form>
        )}

        {view === "resetCode" && (
          <form onSubmit={handleResetCode}>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Enter Reset Code</h2>
            <input
              type="text"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              placeholder="Enter reset code"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Verify Code
            </button>
          </form>
        )}

        {view === "newPassword" && (
          <form onSubmit={handlePasswordReset}>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Set New Password</h2>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;